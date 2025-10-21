import React, { useState, useEffect } from 'react';
import { X, Percent, DollarSign } from 'lucide-react';

interface LineItem {
  id: string;
  product: { name: string };
  quantity: number;
  unitCost?: number;
}

interface InvoiceLineItemPrice {
  lineItemId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  margin: number;
}

interface InvoiceGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    paymentScheme: string;
    taxRate: number;
    shippingCost: number;
    notes?: string;
    dueDate?: string;
    markupPercentage?: number;
    pricingMode?: 'exact' | 'markup';
    lineItemPrices?: { lineItemId: string; unitPrice: number }[];
  }) => void;
  isLoading?: boolean;
  transactionNumber: string;
  transactionType: string;
  lineItems?: LineItem[];
  paymentSchemeAnalysis?: {
    suggestedScheme: string;
    suggestedDepositPercentage?: number;
    estimatedDueDate: string;
    analysis: string;
    highValueWarning?: string;
  };
}

export function InvoiceGenerationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  transactionNumber,
  transactionType,
  lineItems = [],
  paymentSchemeAnalysis
}: InvoiceGenerationModalProps) {
  const [paymentScheme, setPaymentScheme] = useState('immediate');
  const [taxRate, setTaxRate] = useState(12); // Default 12% VAT (Philippines)
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pricingMode, setPricingMode] = useState<'exact' | 'markup'>('markup');
  const [markupPercentage, setMarkupPercentage] = useState(20); // Default 20% markup for CLIENT_PO
  const [invoiceLineItems, setInvoiceLineItems] = useState<InvoiceLineItemPrice[]>([]);

  const isClientPO = transactionType === 'client_po';

  // Initialize line item prices when modal opens
  useEffect(() => {
    if (!isOpen || !isClientPO) return;

    const items: InvoiceLineItemPrice[] = lineItems.map(item => {
      const unitCost = item.unitCost ? parseFloat(item.unitCost.toString()) : 0;
      const unitPrice = unitCost * (1 + markupPercentage / 100);
      const margin = unitCost > 0 ? markupPercentage : 0;

      return {
        lineItemId: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitCost,
        unitPrice,
        margin
      };
    });

    setInvoiceLineItems(items);
  }, [isOpen, isClientPO, lineItems, markupPercentage, pricingMode]);

  // Set defaults from analysis when it loads
  useEffect(() => {
    if (paymentSchemeAnalysis?.suggestedScheme) {
      setPaymentScheme(paymentSchemeAnalysis.suggestedScheme);
    }
    if (paymentSchemeAnalysis?.estimatedDueDate) {
      setDueDate(paymentSchemeAnalysis.estimatedDueDate.split('T')[0]);
    }
  }, [paymentSchemeAnalysis]);

  if (!isOpen) return null;

  const handlePriceChange = (index: number, newPrice: number) => {
    setInvoiceLineItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      item.unitPrice = newPrice;
      // Recalculate margin
      item.margin = item.unitCost > 0
        ? ((newPrice - item.unitCost) / item.unitCost) * 100
        : 0;
      return updated;
    });
  };

  const handleMarkupChange = (newMarkup: number) => {
    setMarkupPercentage(newMarkup);
    // Recalculate all prices based on new markup
    setInvoiceLineItems(prev =>
      prev.map(item => ({
        ...item,
        unitPrice: item.unitCost * (1 + newMarkup / 100),
        margin: newMarkup
      }))
    );
  };

  const getMarginColor = (margin: number) => {
    if (margin < 10) return 'text-red-600';
    if (margin < 20) return 'text-orange-600';
    if (margin < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const calculateTotals = () => {
    if (!isClientPO || invoiceLineItems.length === 0) {
      return { subtotal: 0, taxAmount: 0, total: 0 };
    }

    const subtotal = invoiceLineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount + shippingCost;

    return { subtotal, taxAmount, total };
  };

  const handleConfirm = () => {
    const baseData = {
      paymentScheme,
      taxRate,
      shippingCost,
      notes: notes || undefined,
      dueDate: dueDate || undefined
    };

    if (isClientPO) {
      onConfirm({
        ...baseData,
        pricingMode,
        markupPercentage: pricingMode === 'markup' ? markupPercentage : undefined,
        lineItemPrices: pricingMode === 'exact'
          ? invoiceLineItems.map(item => ({
              lineItemId: item.lineItemId,
              unitPrice: item.unitPrice
            }))
          : undefined
      });
    } else {
      onConfirm(baseData);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] sm:max-h-[85vh] my-4 sm:my-auto flex flex-col">
        {/* Header - Sticky for mobile */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Generate Invoice</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Transaction #{transactionNumber}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Payment Scheme */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Payment Scheme <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentScheme}
              onChange={(e) => setPaymentScheme(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="immediate">Immediate - Payment due on delivery</option>
              <option value="net_30">Net 30 - Payment due in 30 days</option>
              <option value="net_60">Net 60 - Payment due in 60 days</option>
              <option value="net_90">Net 90 - Payment due in 90 days</option>
              <option value="deposit_balance">Deposit & Balance - 50% deposit, 50% on delivery</option>
              <option value="custom">Custom - Custom payment terms</option>
            </select>
            {paymentSchemeAnalysis?.suggestedScheme && (
              <p className="text-sm text-gray-600 mt-1">
                💡 Suggested: {paymentSchemeAnalysis.suggestedScheme.replace('_', ' ').toUpperCase()}
              </p>
            )}
          </div>

          {/* Pricing Mode Selector - Only for CLIENT_PO transactions */}
          {isClientPO && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Pricing Method:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPricingMode('markup')}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                        pricingMode === 'markup'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                      disabled={isLoading}
                    >
                      <Percent className="h-4 w-4" />
                      <span className="hidden sm:inline">Percentage Markup</span>
                      <span className="sm:hidden">% Markup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('exact')}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                        pricingMode === 'exact'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                      disabled={isLoading}
                    >
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline">Exact Price (shows margin)</span>
                      <span className="sm:hidden">Exact Price</span>
                    </button>
                  </div>
                </div>

                {pricingMode === 'markup' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Global Markup:</label>
                    <input
                      type="number"
                      value={markupPercentage}
                      onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                      step="5"
                      disabled={isLoading}
                    />
                    <span className="text-xs sm:text-sm text-gray-700">%</span>
                  </div>
                )}
              </div>

              {/* Line Items Pricing */}
              {invoiceLineItems.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Line Item Pricing</h4>
                  {invoiceLineItems.map((item, index) => (
                    <div key={item.lineItemId} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{item.productName}</h5>
                        <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Unit Cost</label>
                          <p className="text-sm font-medium text-gray-900">
                            ₱{item.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                          {pricingMode === 'exact' ? (
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              min={item.unitCost}
                              step="0.01"
                              disabled={isLoading}
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Margin</label>
                          <p className={`text-sm font-bold ${getMarginColor(item.margin)}`}>
                            {item.margin.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Line Total</label>
                          <p className="text-sm font-medium text-gray-900">
                            ₱{(item.unitPrice * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Totals Preview */}
                  {(() => {
                    const totals = calculateTotals();
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Subtotal:</span>
                            <span className="font-medium">₱{totals.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Tax ({taxRate}%):</span>
                            <span className="font-medium">₱{totals.taxAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {shippingCost > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-700">Shipping:</span>
                              <span className="font-medium">₱{shippingCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-blue-300">
                            <span className="font-bold text-gray-900">Total:</span>
                            <span className="font-bold text-blue-700">₱{totals.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tax Rate */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Shipping Cost */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Shipping Cost (₱)
              </label>
              <input
                type="number"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the invoice..."
              rows={3}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* High Value Warning */}
          {paymentSchemeAnalysis?.highValueWarning && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4">
              <p className="text-sm text-yellow-800 font-medium">⚠️ {paymentSchemeAnalysis.highValueWarning}</p>
            </div>
          )}

          {/* Analysis Info */}
          {paymentSchemeAnalysis?.analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-700">{paymentSchemeAnalysis.analysis}</p>
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}