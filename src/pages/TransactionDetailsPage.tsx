import { useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTransaction } from '../hooks/useTransactions';
import { StatusBadge } from '../components/ui/StatusBadge';
import { TransactionStatus } from '../lib/api/transactions';
import { useSuppliers, useSupplierQuotes, useClientQuotes, useCreateSupplierQuote, useSelectSupplierQuote, useCreateClientQuote, useSendClientQuote, useAcceptClientQuote, useDeleteClientQuote, useGenerateClientQuotePDF, useManuallyRejectClientQuote } from '../hooks/useQuotes';
import { useRFQsByTransaction, useCreateRFQ, useSendRFQ } from '../hooks/useRFQ';
import { useQuoteReviewStats } from '../hooks/useQuoteReview';
import { useTransactionPurchaseOrders, useSubmitPurchaseOrder, useMarkSentManually, useConfirmPurchaseOrder, useReceivePurchaseOrder } from '../hooks/usePurchaseOrders';
import { API_BASE } from '../lib/axios';
import { useFulfillmentByTransaction, useShipFulfillment, useMarkFulfillmentAsDelivered } from '../hooks/useFulfillments';
import { usePaymentSchemeAnalysis, useGenerateInvoice, useInvoicesByTransaction, useSendInvoice, useRecordPayment, usePayments } from '../hooks/useInvoices';
import { SupplierQuoteEntry } from '../components/quotes/SupplierQuoteEntry';
import { QuoteComparisonModal } from '../components/quotes/QuoteComparisonModal';
import { ActiveQuoteComparison } from '../components/quotes/ActiveQuoteComparison';
import { ClientQuoteGeneration } from '../components/quotes/ClientQuoteGeneration';
import { SendClientQuoteMethodModal } from '../components/quotes/SendClientQuoteMethodModal';
import { ManualRejectQuoteModal } from '../components/quotes/ManualRejectQuoteModal';
import { RFQModal } from '../components/rfq/RFQModal';
import { QuoteReviewQueue } from '../components/rfq/QuoteReviewQueue';
import { FulfillmentSection } from '../components/fulfillment/FulfillmentSection';
import { ShippingModal } from '../components/fulfillment/ShippingModal';
import { DeliveryConfirmationModal } from '../components/fulfillment/DeliveryConfirmationModal';
import { InvoiceGenerationModal } from '../components/invoicing/InvoiceGenerationModal';
import { PaymentRecordModal } from '../components/invoicing/PaymentRecordModal';
import { ProcurementSection } from '../components/procurement/ProcurementSection';
import { useSourcingAnalysis } from '../hooks/useSourcingAnalysis';
import ReceiveGoodsModal from '../components/inventory/ReceiveGoodsModal';
import { TransactionProgressGuide } from '../components/transactions/TransactionProgressGuide';
import { showSuccess, showError, showWarning, showInfo } from '../lib/toast';

interface SectionProps {
  title: string;
  status: 'hidden' | 'locked' | 'active' | 'completed';
  isExpanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  lockMessage?: string;
}

function TransactionSection({ title, status, isExpanded = false, onToggle, children, lockMessage }: SectionProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <span className="text-green-600">✅</span>;
      case 'active':
        return <span className="text-blue-600">▶️</span>;
      case 'locked':
        return <span className="text-gray-400">🔒</span>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Completed - Click to Expand for Details';
      case 'active':
        return 'In Progress';
      case 'locked':
        return lockMessage || 'Locked - Complete previous steps first';
      default:
        return '';
    }
  };

  if (status === 'hidden') return null;

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <button
        onClick={onToggle}
        disabled={status === 'locked'}
        className={`flex items-center justify-between w-full px-6 py-4 text-left ${
          status === 'locked'
            ? 'bg-gray-50 cursor-not-allowed'
            : 'bg-white hover:bg-gray-50 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <h3 className={`text-lg font-medium ${status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
            {title}
          </h3>
          <span className={`text-sm ${status === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
            [{getStatusText()}]
          </span>
        </div>

        {status !== 'locked' && (
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}
      </button>

      {isExpanded && status !== 'locked' && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

export function TransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: transaction, isLoading, error } = useTransaction(id!);

  // Quote-related hooks
  const { data: suppliers = [] } = useSuppliers();
  const { data: supplierQuotes = [] } = useSupplierQuotes(id!);
  const { data: clientQuotes = [] } = useClientQuotes(id!);
  const { data: sourcingAnalysis } = useSourcingAnalysis(id);
  const createSupplierQuoteMutation = useCreateSupplierQuote();
  const selectSupplierQuoteMutation = useSelectSupplierQuote();
  const createClientQuoteMutation = useCreateClientQuote();
  const sendClientQuoteMutation = useSendClientQuote();
  const acceptClientQuoteMutation = useAcceptClientQuote();
  const deleteClientQuoteMutation = useDeleteClientQuote();
  const generatePDFMutation = useGenerateClientQuotePDF();
  const manuallyRejectMutation = useManuallyRejectClientQuote();

  // RFQ hooks
  const { data: rfqs = [] } = useRFQsByTransaction(id);
  const createRFQMutation = useCreateRFQ();
  const sendRFQMutation = useSendRFQ();

  // Quote Review hooks
  const { data: reviewStats } = useQuoteReviewStats();

  // Purchase order hooks
  const { data: purchaseOrders = [] } = useTransactionPurchaseOrders(id!);
  const submitPOMutation = useSubmitPurchaseOrder();
  const markSentManuallyMutation = useMarkSentManually();
  const confirmPOMutation = useConfirmPurchaseOrder();
  const receivePOMutation = useReceivePurchaseOrder();

  // Fulfillment hooks
  const { data: fulfillment } = useFulfillmentByTransaction(id);
  const shipFulfillmentMutation = useShipFulfillment();
  const markDeliveredMutation = useMarkFulfillmentAsDelivered();

  // Invoice hooks
  const { data: paymentSchemeAnalysis } = usePaymentSchemeAnalysis(id);
  const { data: invoices = [] } = useInvoicesByTransaction(id);
  const generateInvoiceMutation = useGenerateInvoice();
  const sendInvoiceMutation = useSendInvoice();
  const recordPaymentMutation = useRecordPayment();
  const { data: payments = [] } = usePayments({ transactionId: id });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    quoting: true,
    fulfillment: false,
    procurement: false,
    invoicing: false,
  });

  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Modal states
  const [isSupplierQuoteModalOpen, setIsSupplierQuoteModalOpen] = useState(false);
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [isQuoteComparisonModalOpen, setIsQuoteComparisonModalOpen] = useState(false);
  const [isActiveQuoteComparisonOpen, setIsActiveQuoteComparisonOpen] = useState(false);
  const [isClientQuoteModalOpen, setIsClientQuoteModalOpen] = useState(false);
  const [selectedProductForComparison, setSelectedProductForComparison] = useState<{ id: string; name: string } | null>(null);
  const [selectedLineItemForComparison, setSelectedLineItemForComparison] = useState<{ id: string; name: string } | null>(null);
  const [selectedSupplierQuote, setSelectedSupplierQuote] = useState<any>(null);
  const [selectedPOForReceipt, setSelectedPOForReceipt] = useState<any>(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [isSendQuoteMethodModalOpen, setIsSendQuoteMethodModalOpen] = useState(false);
  const [selectedQuoteToSend, setSelectedQuoteToSend] = useState<any>(null);
  const [isManualRejectModalOpen, setIsManualRejectModalOpen] = useState(false);
  const [selectedQuoteToReject, setSelectedQuoteToReject] = useState<any>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Quote handlers
  const handleCreateSupplierQuote = async (quoteData: any) => {
    // Handle both single quote and array of quotes
    if (Array.isArray(quoteData)) {
      // Create multiple quotes sequentially
      for (const quote of quoteData) {
        await createSupplierQuoteMutation.mutateAsync(quote);
      }
    } else {
      // Single quote
      await createSupplierQuoteMutation.mutateAsync(quoteData);
    }
  };

  const handleCreateClientQuote = async (quoteData: any) => {
    await createClientQuoteMutation.mutateAsync(quoteData);
  };

  const handleGenerateClientQuote = () => {
    setSelectedSupplierQuote(null); // No specific supplier quote selected
    setIsClientQuoteModalOpen(true);
  };

  const handleViewPriceComparison = (productId: string, productName: string) => {
    setSelectedProductForComparison({ id: productId, name: productName });
    setIsQuoteComparisonModalOpen(true);
  };

  const handleCompareActiveQuotes = (lineItemId: string, productName: string) => {
    setSelectedLineItemForComparison({ id: lineItemId, name: productName });
    setIsActiveQuoteComparisonOpen(true);
  };

  const handleSelectQuote = async (quoteId: string, supplierName: string) => {
    try {
      await selectSupplierQuoteMutation.mutateAsync(quoteId);
      showSuccess(`Quote from "${supplierName}" selected successfully!`);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to select quote');
    }
  };

  // RFQ handlers
  const handleCreateAndSendRFQ = async (rfqData: any) => {
    try {
      // Create RFQ
      const createdRFQ = await createRFQMutation.mutateAsync(rfqData);
      showSuccess(`RFQ ${createdRFQ.rfqNumber} created successfully!`);

      // Send RFQ immediately
      const sendResult = await sendRFQMutation.mutateAsync(createdRFQ.id);

      if (sendResult.results.failed > 0) {
        showWarning(
          `RFQ sent: ${sendResult.results.success} succeeded, ${sendResult.results.failed} failed. ` +
          `Errors: ${sendResult.results.errors.join('; ')}`
        );
      } else {
        showSuccess(`RFQ sent successfully to ${sendResult.results.success} supplier(s)!`);
      }

      setIsRFQModalOpen(false);
    } catch (error: any) {
      console.error('Failed to create/send RFQ:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create/send RFQ';
      showError(errorMessage);
    }
  };

  const handleSendQuote = async (quoteId: string, sendMethod: 'manual' | 'automatic') => {
    try {
      // If manual, download PDF first
      if (sendMethod === 'manual') {
        await handleViewPDF(quoteId);
      }

      // Send quote with selected method
      await sendClientQuoteMutation.mutateAsync({ quoteId, sendMethod });

      if (sendMethod === 'manual') {
        showSuccess('Quote marked as sent. PDF downloaded - please send it to the client!');
      } else {
        showSuccess('Quote sent to client via email successfully!');
      }
    } catch (error: any) {
      console.error('Failed to send quote:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to send quote';
      showError(errorMessage);
    }
  };

  const handleSendQuoteMethodSelection = async (method: 'manual' | 'automatic') => {
    if (!selectedQuoteToSend) return;
    await handleSendQuote(selectedQuoteToSend.id, method);
    setSelectedQuoteToSend(null);
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      await acceptClientQuoteMutation.mutateAsync(quoteId);
      console.log('Quote accepted successfully');
    } catch (error: any) {
      console.error('Failed to accept quote:', error);

      // Show user-friendly error message
      const errorMessage = error?.response?.data?.message || 'Failed to accept quote';
      showError(errorMessage);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await deleteClientQuoteMutation.mutateAsync(quoteId);
        console.log('Quote deleted successfully');
      } catch (error) {
        console.error('Failed to delete quote:', error);
      }
    }
  };

  const handleViewPDF = async (quoteId: string) => {
    try {
      await generatePDFMutation.mutateAsync(quoteId);
      showSuccess('Opening PDF in new tab...');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      showError('Failed to generate PDF');
    }
  };

  const handleManuallyRejectQuote = async (reason: string) => {
    if (!selectedQuoteToReject) return;
    try {
      await manuallyRejectMutation.mutateAsync({ quoteId: selectedQuoteToReject.id, reason });
      showSuccess('Quote rejected successfully!');
    } catch (error: any) {
      console.error('Failed to manually reject quote:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to reject quote';
      showError(errorMessage);
    }
  };

  const handleSubmitPO = async (poId: string) => {
    try {
      await submitPOMutation.mutateAsync(poId);
      // Get supplier name for the success message
      const po = purchaseOrders.find(p => p.id === poId);
      const supplierName = po?.supplier?.name || 'supplier';
      showSuccess(`Purchase order sent to ${supplierName} via email successfully!`);
    } catch (error: any) {
      console.error('Failed to submit purchase order:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to submit purchase order';
      showError(errorMessage);
    }
  };

  const handleManualSendPO = async (poId: string) => {
    try {
      // Get PO details for supplier name
      const po = purchaseOrders.find(p => p.id === poId);
      const supplierName = po?.supplier?.name || 'supplier';

      // 1. Download PDF in new tab
      window.open(`${API_BASE}/purchase-orders/${poId}/pdf`, '_blank');

      // 2. Mark as sent manually
      await markSentManuallyMutation.mutateAsync(poId);

      // 3. Show success message
      showSuccess(`PDF downloaded! Please send it to ${supplierName} via WhatsApp, phone, or in-person and get confirmation.`);
    } catch (error: any) {
      console.error('Failed to mark purchase order as sent manually:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to mark purchase order as sent';
      showError(errorMessage);
    }
  };

  const handleConfirmPO = async (poId: string) => {
    try {
      await confirmPOMutation.mutateAsync(poId);
      showSuccess('Purchase order confirmed successfully!');
    } catch (error: any) {
      console.error('Failed to confirm purchase order:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to confirm purchase order';
      showError(errorMessage);
    }
  };

  // Fulfillment handlers
  const handleMarkAsShipped = async (shippingDetails: { estimatedDeliveryDate?: string; notes?: string }) => {
    if (!fulfillment) {
      showError('Fulfillment not found');
      return;
    }

    try {
      await shipFulfillmentMutation.mutateAsync({
        fulfillmentId: fulfillment.id,
        shippingDetails
      });
      console.log('Fulfillment marked as shipped successfully');
      setIsShippingModalOpen(false);
    } catch (error: any) {
      console.error('Failed to ship fulfillment:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to ship fulfillment';
      showError(errorMessage);
    }
  };

  const handleMarkAsDelivered = async () => {
    if (!fulfillment) {
      showError('Fulfillment not found');
      return;
    }

    try {
      await markDeliveredMutation.mutateAsync(fulfillment.id);
      console.log('Fulfillment marked as delivered successfully');
      setIsDeliveryModalOpen(false);
    } catch (error: any) {
      console.error('Failed to mark fulfillment as delivered:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to mark as delivered';
      showError(errorMessage);
    }
  };

  // Invoice handler
  const handleGenerateInvoice = async (invoiceData: {
    paymentScheme: string;
    taxRate: number;
    shippingCost: number;
    notes?: string;
    dueDate?: string;
  }) => {
    try {
      const result = await generateInvoiceMutation.mutateAsync({
        transactionId: id!,
        ...invoiceData
      });
      console.log('Invoice generated successfully:', result);
      setIsInvoiceModalOpen(false);
      showSuccess(`Invoice generated successfully! Invoice #${result.invoice.invoiceNumber}`);
    } catch (error: any) {
      console.error('Failed to generate invoice:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to generate invoice';
      showError(errorMessage);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoiceMutation.mutateAsync(invoiceId);
      console.log('Invoice sent successfully');
      showSuccess('Invoice sent to client successfully!');
    } catch (error: any) {
      console.error('Failed to send invoice:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to send invoice';
      showError(errorMessage);
    }
  };

  const handleRecordPayment = async (paymentData: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }) => {
    if (!selectedInvoiceForPayment) return;

    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: selectedInvoiceForPayment.id,
        ...paymentData
      });
      console.log('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      setSelectedInvoiceForPayment(null);
      showSuccess('Payment recorded successfully!');
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to record payment';
      showError(errorMessage);
    }
  };

  const handleReceivePO = async (poId: string) => {
    try {
      const receiptData = {
        receivedDate: new Date().toISOString(),
        receivedBy: 'User', // In a real app, this would be the current user
        receivingNotes: `Purchase order received on ${new Date().toLocaleDateString()}`
      };
      await receivePOMutation.mutateAsync({ poId, receiptData });
      console.log('Purchase order received successfully');
    } catch (error: any) {
      console.error('Failed to receive purchase order:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to receive purchase order';
      showError(errorMessage);
    }
  };

  const getQuotesForProduct = (productId: string) => {
    return supplierQuotes.filter(quote => quote.lineItem.product.id === productId);
  };

  const getQuotesForLineItem = (lineItemId: string) => {
    return supplierQuotes.filter(quote => quote.lineItem.id === lineItemId);
  };

  const hasAcceptedQuote = () => {
    return clientQuotes.some(quote => quote.status === 'accepted');
  };

  // Track which quotes have been auto-selected to prevent duplicates
  const autoSelectedQuotes = useRef(new Set<string>());

  // Auto-select single quotes when only one quote exists for a line item
  useEffect(() => {
    if (!transaction || !supplierQuotes.length || selectSupplierQuoteMutation.isPending) return;

    transaction.lineItems?.forEach(lineItem => {
      const quotes = getQuotesForLineItem(lineItem.id);

      // Only proceed if exactly 1 quote exists
      if (quotes.length === 1) {
        const singleQuote = quotes[0];

        // Only auto-select if:
        // 1. Not already selected
        // 2. Not already auto-selected before (tracked in ref)
        if (singleQuote.status !== 'selected' && !autoSelectedQuotes.current.has(singleQuote.id)) {
          console.log(`Auto-selecting single quote: ${singleQuote.quoteNumber}`);

          // Mark as auto-selected BEFORE making the call
          autoSelectedQuotes.current.add(singleQuote.id);

          selectSupplierQuoteMutation.mutate(singleQuote.id, {
            onError: () => {
              // Remove from set if selection failed
              autoSelectedQuotes.current.delete(singleQuote.id);
            }
          });
        }
      }
    });
  }, [transaction?.id, supplierQuotes.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Transaction not found</h2>
          <p className="mb-4 text-gray-600">
            The transaction you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getSectionStatus = (section: string) => {
    const status = transaction.status;
    switch (section) {
      case 'quoting':
        if ([TransactionStatus.DRAFT, TransactionStatus.SOURCING].includes(status as any)) return 'active';
        // Quoting is completed once quote is accepted and beyond
        if ([
          TransactionStatus.QUOTED,
          TransactionStatus.ACCEPTED,
          TransactionStatus.PARTIALLY_ALLOCATED,
          TransactionStatus.WAITING_FOR_ITEMS,
          TransactionStatus.READY_FOR_DELIVERY,
          TransactionStatus.OUT_FOR_DELIVERY,
          TransactionStatus.DELIVERED,
          TransactionStatus.COMPLETED
        ].includes(status as any)) return 'completed';
        return 'hidden';
      case 'fulfillment':
        if ([
          TransactionStatus.ACCEPTED,
          TransactionStatus.PARTIALLY_ALLOCATED,
          TransactionStatus.WAITING_FOR_ITEMS
        ].includes(status as any)) return 'active';
        if ([
          TransactionStatus.READY_FOR_DELIVERY,
          TransactionStatus.OUT_FOR_DELIVERY,
          TransactionStatus.DELIVERED,
          TransactionStatus.COMPLETED
        ].includes(status as any)) return 'completed';
        if ([TransactionStatus.DRAFT, TransactionStatus.SOURCING, TransactionStatus.QUOTED].includes(status as any)) return 'locked';
        return 'hidden';
      case 'procurement':
        // Check if there are any items requiring sourcing
        const hasItemsRequiringSourcing = transaction?.lineItems?.some(item => item.requiresSourcing) || false;

        // If nothing needs sourcing and quote is accepted, procurement is immediately completed
        if (!hasItemsRequiringSourcing && [
          TransactionStatus.ACCEPTED,
          TransactionStatus.READY_FOR_DELIVERY,
          TransactionStatus.OUT_FOR_DELIVERY,
          TransactionStatus.DELIVERED,
          TransactionStatus.COMPLETED
        ].includes(status as any)) return 'completed';

        // Active when quote is accepted and there ARE items requiring sourcing
        if (hasItemsRequiringSourcing && [
          TransactionStatus.ACCEPTED,
          TransactionStatus.PARTIALLY_ALLOCATED,
          TransactionStatus.WAITING_FOR_ITEMS
        ].includes(status as any)) return 'active';

        // Completed when ready for delivery or beyond (for items that did require sourcing)
        if ([
          TransactionStatus.READY_FOR_DELIVERY,
          TransactionStatus.OUT_FOR_DELIVERY,
          TransactionStatus.DELIVERED,
          TransactionStatus.COMPLETED
        ].includes(status as any)) return 'completed';

        // Locked only before quote acceptance
        if ([
          TransactionStatus.DRAFT,
          TransactionStatus.SOURCING,
          TransactionStatus.QUOTED
        ].includes(status as any)) return 'locked';

        return 'hidden';
      case 'invoicing':
        if ([TransactionStatus.DELIVERED].includes(status as any)) return 'active';
        if ([TransactionStatus.COMPLETED].includes(status as any)) return 'completed';
        return 'locked';
      default:
        return 'hidden';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TRANSACTION #{transaction.transactionNumber}</h1>
              <p className="text-gray-600">CLIENT: {transaction.client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">OVERALL STATUS:</span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6 p-6 max-w-7xl mx-auto">
        {/* Main Content - Left Side */}
        <div className="flex-1 space-y-4">
          {/* Quoting Section */}
          <TransactionSection
          title="1. QUOTING"
          status={getSectionStatus('quoting')}
          isExpanded={expandedSections.quoting}
          onToggle={() => toggleSection('quoting')}
        >
          <div className="space-y-6">
            {/* Section Header */}
            <div className="pb-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Line Items to Fulfill</h3>
            </div>

            {/* Items Fulfilled from Stock */}
            {(() => {
              const stockItems = transaction?.lineItems?.filter(item => !item.requiresSourcing) || [];
              if (stockItems.length === 0) return null;

              return (
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <h4 className="mb-3 text-sm font-semibold text-green-900">Items Fulfilled from Stock</h4>
                  <div className="space-y-3">
                    {stockItems.map((item, index) => {
                      const sourcingInfo = sourcingAnalysis?.lineItems?.find(si => si.lineItemId === item.id);
                      const calculatedCost = sourcingInfo?.inventoryCost || (item.unitCost ? item.unitCost * item.quantity : 0);

                      return (
                        <div key={index} className="p-3 bg-white border border-green-200 rounded">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{item.product.name}</p>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                System has calculated the cost for these items from your inventory.
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                ₱{calculatedCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500">(using FEFO/FIFO)</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Items Requiring Sourcing */}
            {(() => {
              const sourcingItems = transaction?.lineItems?.filter(item => item.requiresSourcing) || [];
              if (sourcingItems.length === 0) return null;

              return (
                <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-orange-900">Items Requiring Sourcing</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsRFQModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-purple-600 rounded hover:bg-purple-700"
                      >
                        <Plus className="w-3 h-3" />
                        Send RFQ
                      </button>
                      <button
                        onClick={() => setIsSupplierQuoteModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        <Plus className="w-3 h-3" />
                        Add Supplier Quote
                      </button>
                      {reviewStats && reviewStats.pending > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700">
                          <AlertTriangle className="h-3 w-3" />
                          {reviewStats.pending} pending review{reviewStats.pending !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {sourcingItems.map((item, index) => {
                      const productQuotes = getQuotesForProduct(item.product.id);
                      const isExpanded = expandedProducts[item.product.id] || false;
                      const sourcingInfo = sourcingAnalysis?.lineItems?.find(si => si.lineItemId === item.id);
                      const inventoryAvailable = sourcingInfo?.inventoryAvailable || 0;
                      const quantityToSource = item.backorderedQuantity || (item.quantity - inventoryAvailable);

                      return (
                        <div key={index} className="p-3 bg-white border border-orange-200 rounded">
                          {/* Product Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">{item.product.name}</p>
                              <p className="text-sm text-gray-600">
                                Quantity: {quantityToSource}
                                {inventoryAvailable > 0 && <span className="text-orange-600"> (shortfall)</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const lineItemQuotes = getQuotesForLineItem(item.id);
                                return (
                                  <>
                                    {lineItemQuotes.length > 1 && (
                                      <button
                                        onClick={() => handleCompareActiveQuotes(item.id, item.product.name)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                                        title="Compare active quotes from different suppliers"
                                      >
                                        Compare and Select Quotes
                                      </button>
                                    )}
                                    {productQuotes.length > 0 && (
                                      <button
                                        onClick={() => handleViewPriceComparison(item.product.id, item.product.name)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                        title="View historical price trends"
                                      >
                                        <TrendingUp className="w-3 h-3" />
                                        Price History
                                      </button>
                                    )}
                                    <div
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        lineItemQuotes.length > 0
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-orange-100 text-orange-800'
                                      }`}
                                    >
                                      {lineItemQuotes.length > 0
                                        ? `${lineItemQuotes.length} quote${lineItemQuotes.length > 1 ? 's' : ''}`
                                        : 'No quotes'}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Supplier Quotes */}
                          {productQuotes.length > 0 && (
                            <>
                              <button
                                onClick={() => toggleProductExpansion(item.product.id)}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                {isExpanded ? 'Hide' : 'View'} Supplier Quotes
                              </button>

                              {isExpanded && (
                                <div className="mt-3 ml-4 space-y-2">
                                  {productQuotes.map((quote, idx) => {
                                    const isSelected = quote.status === 'selected';
                                    return (
                                      <div key={idx} className={`p-3 text-sm border rounded ${isSelected ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium text-gray-900">
                                                {quote.supplier?.name || quote.supplierName}
                                              </span>
                                              {isSelected && (
                                                <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                                                  Selected
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                              <span className="font-medium text-gray-900">
                                                ₱{quote.unitCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}/unit
                                              </span>
                                              <span>•</span>
                                              <span>Total: ₱{(quote.unitCost * quote.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                              {quote.leadTimeDays && (
                                                <>
                                                  <span>•</span>
                                                  <span>{quote.leadTimeDays} days</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                          {!isSelected && (
                                            <button
                                              onClick={() => handleSelectQuote(quote.id, quote.supplier?.name || quote.supplierName || 'this supplier')}
                                              disabled={selectSupplierQuoteMutation.isPending}
                                              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                              {selectSupplierQuoteMutation.isPending ? 'Selecting...' : 'Select'}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Sourcing Progress */}
                  <div className="mt-4 pt-3 border-t border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Sourcing Progress</span>
                      <span className="text-xs text-gray-600">
                        {sourcingItems.filter(item => getQuotesForProduct(item.product.id).length > 0).length} / {sourcingItems.length} products quoted
                      </span>
                    </div>
                    <div className="w-full h-2 bg-orange-200 rounded-full">
                      <div
                        className="h-2 transition-all duration-300 bg-orange-600 rounded-full"
                        style={{
                          width: `${sourcingItems.length > 0 ? (sourcingItems.filter(item => getQuotesForProduct(item.product.id).length > 0).length / sourcingItems.length) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* RFQ Tracking Section */}
            {rfqs.length > 0 && (
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                <h4 className="mb-3 text-sm font-semibold text-purple-900">Request for Quotation (RFQ) History</h4>
                <div className="space-y-2">
                  {rfqs.map((rfq) => (
                    <div key={rfq.id} className="p-3 bg-white border border-purple-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{rfq.rfqNumber}</p>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                rfq.status === 'sent'
                                  ? 'bg-blue-100 text-blue-700'
                                  : rfq.status === 'responses_received'
                                  ? 'bg-green-100 text-green-700'
                                  : rfq.status === 'closed'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {rfq.status === 'sent' && 'Sent'}
                              {rfq.status === 'responses_received' && 'Responses Received'}
                              {rfq.status === 'closed' && 'Closed'}
                              {rfq.status === 'draft' && 'Draft'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>
                              {rfq.lineItems.length} product(s) • {rfq.targetSuppliers.length} supplier(s) contacted
                            </p>
                            {rfq.responseDeadline && (
                              <p>
                                Deadline: {new Date(rfq.responseDeadline).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                {new Date(rfq.responseDeadline) < new Date() && (
                                  <span className="text-red-600 ml-1">(Expired)</span>
                                )}
                              </p>
                            )}
                            {rfq.sentAt && (
                              <p>
                                Sent: {new Date(rfq.sentAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quote Review Queue Section */}
            {reviewStats && reviewStats.pending > 0 && (
              <div className="mt-6 rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                <QuoteReviewQueue />
              </div>
            )}

            {/* Client Quotation Summary - Always Visible */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h4 className="mb-3 text-sm font-semibold text-blue-900">Client Quotation Summary</h4>
              <p className="mb-3 text-xs text-gray-600">
                This is the final quote you will send to the client.
              </p>

              {/* Cost Breakdown */}
              <div className="p-3 mb-3 space-y-2 text-sm bg-white border border-blue-200 rounded">
                {(() => {
                  const stockItems = transaction?.lineItems?.filter(item => !item.requiresSourcing) || [];
                  const sourcingItems = transaction?.lineItems?.filter(item => item.requiresSourcing) || [];

                  const stockCost = stockItems.reduce((sum, item) => {
                    const sourcingInfo = sourcingAnalysis?.lineItems?.find(si => si.lineItemId === item.id);
                    return sum + (sourcingInfo?.inventoryCost || (item.unitCost ? item.unitCost * item.quantity : 0));
                  }, 0);

                  const sourcingCost = sourcingItems.reduce((sum, item) => {
                    const quotes = getQuotesForProduct(item.product.id);
                    if (quotes.length === 0) return sum;
                    // Use the selected quote if available, otherwise use lowest quote
                    const selectedQuote = quotes.find(q => q.status === 'selected');
                    const quoteToUse = selectedQuote || quotes.reduce((min, q) => q.unitCost < min.unitCost ? q : min);
                    return sum + (quoteToUse.unitCost * quoteToUse.quantity);
                  }, 0);

                  const totalCost = stockCost + sourcingCost;

                  return (
                    <>
                      {stockItems.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost from Stock:</span>
                          <span className="font-medium">₱{stockCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {sourcingItems.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost from Sourcing:</span>
                          <span className="font-medium">₱{sourcingCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-900">Total Cost of Goods:</span>
                        <span className="font-semibold">₱{totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Generate Quote Button */}
              <button
                onClick={handleGenerateClientQuote}
                disabled={hasAcceptedQuote()}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={hasAcceptedQuote() ? 'A quote has already been accepted for this transaction' : 'Create a formal quote to send to the client'}
              >
                <Plus className="w-4 h-4" />
                {hasAcceptedQuote() ? 'Quote Already Accepted' : 'Generate Formal Quote'}
              </button>

              {/* Generated Client Quotes */}
              {clientQuotes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h5 className="mb-3 text-sm font-medium text-gray-700">Generated Quotes</h5>
                  <div className="space-y-2">
                    {clientQuotes.map((quote, idx) => (
                      <div key={idx} className="p-3 bg-white border border-blue-200 rounded">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{quote.quoteNumber}</p>
                            <p className="text-sm text-gray-600">
                              ₱{quote.totalAmount?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">
                              Pre-tax: ₱{((quote.totalAmount || 0) / 1.12).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </p>
                            {/* Response tracking information */}
                            {quote.clientResponseEmail && (
                              <div className="mt-2 text-xs">
                                <p className="text-gray-600">
                                  <span className="font-medium">Response from:</span> {quote.clientResponseEmail}
                                </p>
                                {quote.clientResponseDate && (
                                  <p className="text-gray-500">
                                    {new Date(quote.clientResponseDate).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                    {quote.responseMethod && ` (${quote.responseMethod})`}
                                  </p>
                                )}
                                {quote.rejectionReason && (
                                  <p className="text-red-600 mt-1">
                                    <span className="font-medium">Reason:</span> {quote.rejectionReason}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              quote.status === 'sent'
                                ? 'bg-blue-100 text-blue-700'
                                : quote.status === 'accepted'
                                ? 'bg-green-100 text-green-700'
                                : quote.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {quote.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewPDF(quote.id)}
                            className="text-xs text-blue-600 hover:underline"
                            disabled={generatePDFMutation.isPending}
                          >
                            {generatePDFMutation.isPending ? 'Generating...' : 'View PDF'}
                          </button>
                          {quote.status === 'draft' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedQuoteToSend(quote);
                                  setIsSendQuoteMethodModalOpen(true);
                                }}
                                className="text-xs text-green-600 hover:underline"
                              >
                                Send Quote
                              </button>
                              <button
                                onClick={() => handleDeleteQuote(quote.id)}
                                className="text-xs text-red-600 hover:underline"
                                disabled={deleteClientQuoteMutation.isPending}
                              >
                                {deleteClientQuoteMutation.isPending ? 'Deleting...' : 'Delete'}
                              </button>
                            </>
                          )}
                          {quote.status === 'sent' && (
                            <>
                              <button
                                onClick={() => handleAcceptQuote(quote.id)}
                                className={`text-xs hover:underline ${
                                  hasAcceptedQuote()
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-green-600'
                                }`}
                                disabled={acceptClientQuoteMutation.isPending || hasAcceptedQuote()}
                                title={hasAcceptedQuote() ? 'Another quote has already been accepted for this transaction' : 'Accept quote and process order (creates POs, allocates inventory, initiates fulfillment)'}
                              >
                                {acceptClientQuoteMutation.isPending
                                  ? 'Accepting...'
                                  : hasAcceptedQuote()
                                  ? 'Quote Already Accepted'
                                  : 'Accept Quote'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedQuoteToReject(quote);
                                  setIsManualRejectModalOpen(true);
                                }}
                                className="text-xs text-red-600 hover:underline"
                                title="Mark as rejected manually (client rejected via phone, WhatsApp, etc.)"
                              >
                                Mark as Rejected
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TransactionSection>

        {/* Fulfillment Section */}
        <TransactionSection
          title="2. FULFILLMENT"
          status={getSectionStatus('fulfillment')}
          isExpanded={expandedSections.fulfillment}
          onToggle={() => toggleSection('fulfillment')}
          lockMessage="Complete quoting first"
        >
          <FulfillmentSection
            orderNumber={transaction.transactionNumber}
            status={transaction.status}
            lineItems={transaction?.lineItems?.map(item => ({
              productId: item.product.id,
              productName: item.product.name,
              quantityNeeded: item.quantity,
              quantityAllocated: item.allocatedQuantity || 0,
              allocations: item.stockAllocations?.map((alloc: any) => ({
                source: alloc.source === 'stock' ? 'stock' : 'procurement',
                quantity: alloc.quantity,
                batchNumber: alloc.inventoryBatch?.batchNumber,
                purchaseOrderId: alloc.inventoryBatch?.purchaseOrderId,
                poNumber: alloc.inventoryBatch?.purchaseOrder?.poNumber,
                status: alloc.status
              })) || []
            })) || []}
            onMarkAsShipped={() => setIsShippingModalOpen(true)}
            onMarkAsDelivered={() => setIsDeliveryModalOpen(true)}
          />
        </TransactionSection>

        {/* Procurement Section */}
        <TransactionSection
          title="3. PROCUREMENT"
          status={getSectionStatus('procurement')}
          isExpanded={expandedSections.procurement}
          onToggle={() => toggleSection('procurement')}
          lockMessage="Accept a client quote first"
        >
          <ProcurementSection
            backorders={transaction?.lineItems?.flatMap(lineItem =>
              lineItem.backorders?.map((bo: any) => ({
                id: bo.id,
                productName: bo.product?.name || bo.lineItem?.product?.name || 'Unknown Product',
                quantityNeeded: bo.quantity,
                quantityReceived: bo.status === 'fulfilled' ? bo.quantity : 0,
                status: bo.status,
                purchaseOrderId: bo.purchaseOrderId,
                poNumber: bo.purchaseOrder?.poNumber
              })) || []
            ).filter(Boolean) || []}
            purchaseOrders={purchaseOrders}
            onSubmitPO={handleSubmitPO}
            onManualSendPO={handleManualSendPO}
            onConfirmPO={handleConfirmPO}
            onReceivePO={(poId) => {
              const po = purchaseOrders.find(p => p.id === poId);
              if (po && (po.status === 'confirmed' || po.status === 'partially_received')) {
                setSelectedPOForReceipt(po);
              } else {
                handleReceivePO(poId);
              }
            }}
            onOpenReceiptModal={(po) => setSelectedPOForReceipt(po)}
            isLoading={{
              submit: submitPOMutation.isPending,
              manualSend: markSentManuallyMutation.isPending,
              confirm: confirmPOMutation.isPending,
              receive: receivePOMutation.isPending
            }}
          />
        </TransactionSection>

        {/* Invoicing Section */}
        <TransactionSection
          title="4. INVOICING & PAYMENTS"
          status={getSectionStatus('invoicing')}
          isExpanded={expandedSections.invoicing}
          onToggle={() => toggleSection('invoicing')}
          lockMessage="Complete delivery first"
        >
          <div className="space-y-4">
            {transaction.status === TransactionStatus.DELIVERED ? (
              <>
                <p className="text-gray-600">The order has been completed. Please generate an invoice to bill the client.</p>
                {invoices.length === 0 ? (
                  <button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Generate Invoice
                  </button>
                ) : null}
              </>
            ) : transaction.status === TransactionStatus.COMPLETED ? (
              /* Scenario 2: Invoice Details & Payment Tracking */
              invoices.length > 0 ? (
                <div className="space-y-6">
                  {invoices.map((invoice) => {
                    const invoicePayments = payments.filter(p => p.invoiceId === invoice.id);

                    return (
                      <div key={invoice.id} className="space-y-4">
                        {/* Invoice Summary Header */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Invoice Details</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">Invoice #:</span>
                              <p className="font-medium">{invoice.invoiceNumber}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Status:</span>
                              <p>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                  invoice.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-700' :
                                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {invoice.status === 'partially_paid' ? 'PARTIALLY PAID' : invoice.status.toUpperCase()}
                                </span>
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Balance Due:</span>
                              <p className="font-medium text-lg text-red-600">
                                ₱{invoice.balanceDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500">
                                Pre-tax: ₱{(invoice.balanceDue / 1.12).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Payment History/Schedule */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Payment History</h4>
                          {invoicePayments.length > 0 ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Method</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Reference</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {invoicePayments.map((payment) => (
                                    <tr key={payment.id}>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        ₱{payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentMethod}</td>
                                      <td className="px-4 py-3 text-sm text-gray-600">{payment.referenceNumber || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">No payments recorded yet.</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleSendInvoice(invoice.id)}
                              disabled={sendInvoiceMutation.isPending}
                              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {sendInvoiceMutation.isPending ? 'Sending...' : 'Send Invoice'}
                            </button>
                          )}
                          {invoice.balanceDue > 0 && invoice.status !== 'draft' && (
                            <button
                              onClick={() => {
                                setSelectedInvoiceForPayment(invoice);
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                            >
                              Record Payment
                            </button>
                          )}
                          <button
                            onClick={() => showInfo('View Invoice PDF - Feature coming soon')}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            View Invoice PDF
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">Invoice has been generated.</p>
              )
            ) : (
              <>
                <p className="text-gray-600">This section will become active once the order is marked as 'Delivered'.</p>
                <button
                  disabled
                  className="px-4 py-2 text-gray-500 bg-gray-300 rounded cursor-not-allowed"
                >
                  Generate Invoice
                </button>
              </>
            )}
          </div>
        </TransactionSection>
        </div>

        {/* Sticky Progress Guide - Right Side */}
        <div className="w-96 flex-shrink-0">
          <div className="sticky top-6">
            <TransactionProgressGuide
              transaction={transaction}
              clientQuotes={clientQuotes}
              supplierQuotes={supplierQuotes}
              purchaseOrders={purchaseOrders}
              fulfillment={fulfillment}
              invoices={invoices}
            />
          </div>
        </div>
      </div>

      {/* Quote Modals */}
      {transaction && (
        <SupplierQuoteEntry
          isOpen={isSupplierQuoteModalOpen}
          onClose={() => setIsSupplierQuoteModalOpen(false)}
          transaction={transaction}
          suppliers={suppliers}
          onSubmit={handleCreateSupplierQuote}
          sourcingAnalysis={sourcingAnalysis}
          multiMode={true}
        />
      )}

      {/* RFQ Modal */}
      {transaction && (
        <RFQModal
          isOpen={isRFQModalOpen}
          onClose={() => setIsRFQModalOpen(false)}
          transaction={transaction}
          suppliers={suppliers}
          onSubmit={handleCreateAndSendRFQ}
          isSubmitting={createRFQMutation.isPending || sendRFQMutation.isPending}
        />
      )}

      <QuoteComparisonModal
        isOpen={isQuoteComparisonModalOpen}
        onClose={() => {
          setIsQuoteComparisonModalOpen(false);
          setSelectedProductForComparison(null);
        }}
        productId={selectedProductForComparison?.id || ''}
        productName={selectedProductForComparison?.name || ''}
        currentQuotes={supplierQuotes}
      />

      <ActiveQuoteComparison
        isOpen={isActiveQuoteComparisonOpen}
        onClose={() => {
          setIsActiveQuoteComparisonOpen(false);
          setSelectedLineItemForComparison(null);
        }}
        lineItemId={selectedLineItemForComparison?.id || ''}
        productName={selectedLineItemForComparison?.name || ''}
        transactionId={id!}
      />

      {transaction && (
        <ClientQuoteGeneration
          isOpen={isClientQuoteModalOpen}
          onClose={() => {
            setIsClientQuoteModalOpen(false);
            setSelectedSupplierQuote(null);
          }}
          transaction={transaction}
          supplierQuotes={supplierQuotes}
          selectedSupplierQuote={selectedSupplierQuote}
          onSubmit={handleCreateClientQuote}
        />
      )}

      {/* Purchase Order Receipt Modal */}
      <ReceiveGoodsModal
        purchaseOrderId={selectedPOForReceipt?.id || ''}
        isOpen={!!selectedPOForReceipt}
        onClose={() => setSelectedPOForReceipt(null)}
      />

      <ShippingModal
        isOpen={isShippingModalOpen}
        onClose={() => setIsShippingModalOpen(false)}
        onConfirm={handleMarkAsShipped}
        isLoading={shipFulfillmentMutation.isPending}
        transactionNumber={transaction.transactionNumber}
      />

      <DeliveryConfirmationModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        onConfirm={handleMarkAsDelivered}
        isLoading={markDeliveredMutation.isPending}
        transactionNumber={transaction.transactionNumber}
      />

      <InvoiceGenerationModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onConfirm={handleGenerateInvoice}
        isLoading={generateInvoiceMutation.isPending}
        transactionNumber={transaction.transactionNumber}
        paymentSchemeAnalysis={paymentSchemeAnalysis}
      />

      {selectedInvoiceForPayment && (
        <PaymentRecordModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          onConfirm={handleRecordPayment}
          isLoading={recordPaymentMutation.isPending}
          invoiceNumber={selectedInvoiceForPayment.invoiceNumber}
          defaultAmount={selectedInvoiceForPayment.balanceDue}
        />
      )}

      {/* Send Client Quote Method Modal */}
      {selectedQuoteToSend && (
        <SendClientQuoteMethodModal
          isOpen={isSendQuoteMethodModalOpen}
          onClose={() => {
            setIsSendQuoteMethodModalOpen(false);
            setSelectedQuoteToSend(null);
          }}
          onSelectMethod={handleSendQuoteMethodSelection}
          clientName={transaction.client.name}
          clientEmail={transaction.client.email}
          quoteNumber={selectedQuoteToSend.quoteNumber}
        />
      )}

      {/* Manual Reject Quote Modal */}
      {selectedQuoteToReject && (
        <ManualRejectQuoteModal
          isOpen={isManualRejectModalOpen}
          onClose={() => {
            setIsManualRejectModalOpen(false);
            setSelectedQuoteToReject(null);
          }}
          onConfirm={handleManuallyRejectQuote}
          quoteNumber={selectedQuoteToReject.quoteNumber}
          clientName={transaction.client.name}
        />
      )}
    </div>
  );
}