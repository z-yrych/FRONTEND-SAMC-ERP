/**
 * SendInvoiceModal
 *
 * Used for: INVOICE SENDING workflow
 * Location: Dashboard > Transaction Overview > "Send Invoice" button
 *
 * Purpose: Displays list of generated invoices (not yet sent) and allows user to select
 * which invoices to send to clients (sets sentAt timestamp).
 */

import React, { useState } from 'react';
import { X, Send, CheckSquare, Square, AlertCircle, FileText } from 'lucide-react';
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
      email: string;
    };
  };
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  balanceDue: number;
  issueDate: string;
  dueDate: string;
  sentAt: string | null;
  createdAt: string;
}

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}


export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  // Fetch unsent invoices
  const { data: unsentInvoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', 'unsent'],
    queryFn: async () => {
      const response = await api.get(`/invoices`);
      // Filter for invoices that haven't been sent yet
      return response.data.filter((invoice: Invoice) => !invoice.sentAt);
    },
    enabled: isOpen,
  });

  // Send invoices mutation
  const sendInvoicesMutation = useMutation({
    mutationFn: async (invoiceIds: string[]) => {
      const results = await Promise.all(
        invoiceIds.map(async (id) => {
          const response = await api.put(`/invoices/${id}/send`);
          return response.data;
        })
      );
      return results;
    },
    onSuccess: (data) => {
      const count = data.length;
      showSuccess(`Successfully sent ${count} invoice${count !== 1 ? 's' : ''} to client${count !== 1 ? 's' : ''}!`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setSelectedInvoices(new Set());
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to send invoices:', error);
      showError(`Failed to send invoices: ${error.response?.data?.message || error.message}`);
    },
  });

  const toggleInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const toggleAll = () => {
    if (selectedInvoices.size === unsentInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(unsentInvoices.map(invoice => invoice.id)));
    }
  };

  const handleSend = async () => {
    if (selectedInvoices.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to send ${selectedInvoices.size} invoice(s) to clients?\n\n` +
      `This will:\n` +
      `- Email invoices to clients\n` +
      `- Mark invoices as sent\n` +
      `- Start payment tracking`
    );

    if (!confirmed) return;

    sendInvoicesMutation.mutate(Array.from(selectedInvoices));
  };

  if (!isOpen) return null;

  const allSelected = selectedInvoices.size === unsentInvoices.length && unsentInvoices.length > 0;
  const someSelected = selectedInvoices.size > 0 && selectedInvoices.size < unsentInvoices.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Invoices</h2>
              <p className="text-sm text-gray-500">
                Select generated invoices to send to clients
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <TransactionCardListSkeleton count={3} />
          ) : unsentInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No unsent invoices found</p>
              <p className="text-sm text-gray-400 mt-1">
                Generate invoices first or all invoices have been sent
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : someSelected ? (
                    <Square className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {allSelected ? 'Deselect All' : 'Select All'} ({unsentInvoices.length} invoice{unsentInvoices.length !== 1 ? 's' : ''})
                </button>
                <span className="text-sm text-gray-500">
                  {selectedInvoices.size} selected
                </span>
              </div>

              {/* Invoice List */}
              <div className="space-y-3">
                {unsentInvoices.map((invoice) => {
                  const isSelected = selectedInvoices.has(invoice.id);
                  const isOverdue = new Date(invoice.dueDate) < new Date();
                  const daysSinceIssue = Math.floor(
                    (Date.now() - new Date(invoice.issueDate).getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={invoice.id}
                      onClick={() => toggleInvoice(invoice.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center pt-1">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {invoice.invoiceNumber}
                                </h3>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                  Not Sent
                                </span>
                                {isOverdue && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                    Overdue
                                  </span>
                                )}
                                {!isOverdue && daysSinceIssue > 3 && (
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                    Pending {daysSinceIssue} days
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Client: {invoice.transaction.client.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Email: {invoice.transaction.client.email || 'No email on file'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Transaction: {invoice.transaction.transactionNumber}
                              </p>
                            </div>
                            <div className="text-right">
                              <div>
                                <p className="text-xs text-gray-500">Total Amount:</p>
                                <p className="font-semibold text-gray-900">
                                  ₱{Number(invoice.totalAmount).toFixed(2)}
                                </p>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-gray-500">Balance Due:</p>
                                <p className="text-sm font-medium text-red-600">
                                  ₱{Number(invoice.balanceDue).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Invoice Details */}
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Subtotal:</span> ₱{Number(invoice.subtotal).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Tax:</span> ₱{Number(invoice.taxAmount).toFixed(2)}
                            </div>
                            {invoice.shippingCost > 0 && (
                              <div className="text-xs text-gray-600 col-span-2">
                                <span className="font-medium">Shipping:</span> ₱{Number(invoice.shippingCost).toFixed(2)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</span>
                            <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-900">
                  <p className="font-medium mb-1">What happens when you send invoices?</p>
                  <ul className="list-disc list-inside space-y-1 text-indigo-800">
                    <li>Invoices will be emailed to clients automatically</li>
                    <li>The "Sent At" timestamp will be recorded</li>
                    <li>Payment tracking and reminders will begin</li>
                    <li>Clients can view and pay their invoices</li>
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSend();
                  }}
                  disabled={selectedInvoices.size === 0 || sendInvoicesMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendInvoicesMutation.isPending
                    ? `Sending...`
                    : `Send ${selectedInvoices.size > 0 ? selectedInvoices.size : ''} Invoice${selectedInvoices.size !== 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
