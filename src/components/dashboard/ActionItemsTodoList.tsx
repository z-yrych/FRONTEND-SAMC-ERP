import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { fetchLowStockProducts, fetchProductsMissingAlertLevels } from '../../lib/api/products';
import { fetchTransactionOverviewStats } from '../../lib/api/transactions';
import {
  CheckCircle,
  AlertTriangle,
  Package,
  FileText,
  ClipboardCheck,
  TrendingDown,
  Send,
  ShoppingCart,
  Truck,
  DollarSign,
  Clock,
  ChevronRight,
  ListTodo
} from 'lucide-react';
import { RestockModal } from '../inventory/RestockModal';
import { AdjustmentApprovalModal } from '../stock-count/AdjustmentApprovalModal';
import { RestockingRFQListModal } from '../restocking-rfq/RestockingRFQListModal';
import { RestockingMethodModal } from '../restocking-rfq/RestockingMethodModal';
import { RestockingRFQModal } from '../restocking-rfq/RestockingRFQModal';
import { SendPurchaseOrdersModal } from '../procurement/SendPurchaseOrdersModal';
import { ReceivePurchaseOrdersModal } from '../procurement/ReceivePurchaseOrdersModal';
import { ConfirmPOSentModal } from '../procurement/ConfirmPOSentModal';
import { TransactionPOActionsModal } from '../procurement/TransactionPOActionsModal';
import { IncompleteMasterDataModal } from '../masterdata/IncompleteMasterDataModal';
import { SetAlertLevelsModal } from '../products/SetAlertLevelsModal';
import { TransactionActionsModal } from '../transactions/TransactionActionsModal';
import { AllocationOpportunitiesModal } from '../inventory/AllocationOpportunitiesModal';
import type { TransactionActionType } from '../../lib/api/transactions';

interface TodoItem {
  id: string;
  type: 'low_stock' | 'stock_count' | 'adjustment' | 'procurement' | 'transaction' | 'restocking_rfq';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  count?: number;
  icon: any;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  action: () => void;
  actionLabel: string;
  metadata?: any;
}

export function ActionItemsTodoList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAdjustmentsModalOpen, setIsAdjustmentsModalOpen] = useState(false);
  const [isRFQResponsesModalOpen, setIsRFQResponsesModalOpen] = useState(false);
  const [isRFQAwaitingModalOpen, setIsRFQAwaitingModalOpen] = useState(false);
  const [isSendPOsModalOpen, setIsSendPOsModalOpen] = useState(false);
  const [isReceivePOsModalOpen, setIsReceivePOsModalOpen] = useState(false);
  const [isRestockingMethodModalOpen, setIsRestockingMethodModalOpen] = useState(false);
  const [isRestockingRFQModalOpen, setIsRestockingRFQModalOpen] = useState(false);
  const [isIncompleteMasterDataModalOpen, setIsIncompleteMasterDataModalOpen] = useState(false);
  const [isSetAlertLevelsModalOpen, setIsSetAlertLevelsModalOpen] = useState(false);
  const [isTransactionActionsModalOpen, setIsTransactionActionsModalOpen] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<TransactionActionType | null>(null);
  const [isConfirmPOModalOpen, setIsConfirmPOModalOpen] = useState(false);
  const [selectedPOForConfirm, setSelectedPOForConfirm] = useState<any>(null);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isConfirmTransactionPOsModalOpen, setIsConfirmTransactionPOsModalOpen] = useState(false);
  const [isReceiveTransactionPOsModalOpen, setIsReceiveTransactionPOsModalOpen] = useState(false);

  // Fetch all data sources
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => fetchLowStockProducts(),
    refetchInterval: 60000,
  });

  const { data: restockingStats } = useQuery({
    queryKey: ['restocking-po-stats'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders/restocking-stats');
      return response.data;
    },
    refetchInterval: 60000,
  });

  const { data: transactionPOStats } = useQuery({
    queryKey: ['transaction-fulfillment-po-stats'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders/transaction-fulfillment-stats');
      return response.data;
    },
    refetchInterval: 60000,
  });

  const { data: transactionStats } = useQuery({
    queryKey: ['transaction-overview-stats'],
    queryFn: fetchTransactionOverviewStats,
    refetchInterval: 60000,
  });

  const { data: stockCountStats } = useQuery({
    queryKey: ['stock-count-session-stats'],
    queryFn: async () => {
      const response = await api.get('/inventory/stock-count/sessions/stats');
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: adjustmentStats } = useQuery({
    queryKey: ['inventory-adjustment-stats'],
    queryFn: async () => {
      const response = await api.get('/inventory/adjustments/stats');
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  const { data: restockingRfqStats } = useQuery({
    queryKey: ['restocking-rfq-stats'],
    queryFn: async () => {
      const response = await api.get('/restocking-rfq/stats');
      return response.data;
    },
    refetchInterval: 60000,
  });

  const { data: incompleteStats } = useQuery({
    queryKey: ['master-data-incomplete-stats'],
    queryFn: async () => {
      const response = await api.get('/master-data/incomplete-stats');
      return response.data;
    },
    refetchInterval: 60000,
  });

  const { data: productsMissingAlerts = [] } = useQuery({
    queryKey: ['products-missing-alert-levels'],
    queryFn: fetchProductsMissingAlertLevels,
    refetchInterval: 60000,
  });

  const { data: posNeedingFollowUp = [] } = useQuery({
    queryKey: ['pos-needs-followup'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders/needs-followup');
      return response.data;
    },
    refetchInterval: 60000,
  });

  const { data: allocationStats } = useQuery({
    queryKey: ['allocation-opportunities-stats'],
    queryFn: async () => {
      const response = await api.get('/inventory/allocation-opportunities/stats');
      return response.data;
    },
    refetchInterval: 60000,
  });

  // Helper to scroll to section smoothly
  const scrollToSection = (sectionName: string) => {
    const element = document.querySelector(`[data-section="${sectionName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Helper to open transaction actions modal
  const openTransactionActionsModal = (actionType: TransactionActionType) => {
    setSelectedActionType(actionType);
    setIsTransactionActionsModalOpen(true);
  };

  // Handle restocking method selection for out-of-stock items
  const handleRestockMethodSelection = (method: 'direct_po' | 'rfq') => {
    // Close the method modal first
    setIsRestockingMethodModalOpen(false);

    // Then open the appropriate modal based on the selected method
    if (method === 'direct_po') {
      setIsRestockModalOpen(true);
    } else if (method === 'rfq') {
      setIsRestockingRFQModalOpen(true);
    }
  };

  // Build unified TODO list
  const todoItems: TodoItem[] = [];

  // CRITICAL PRIORITY
  // Critical: Out of Stock items
  lowStockProducts
    .filter((p: any) => p.stockLevel?.available === 0)
    .forEach((product: any) => {
      todoItems.push({
        id: `low-stock-critical-${product.id}`,
        type: 'low_stock',
        priority: 'critical',
        title: `OUT OF STOCK: ${product.name}`,
        description: `No units available (${product.stockLevel.allocated} allocated)`,
        icon: AlertTriangle,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        action: () => {
          setSelectedProduct({
            id: product.id,
            name: product.name,
            currentStock: product.stockLevel?.available || 0
          });
          setIsRestockingMethodModalOpen(true);
        },
        actionLabel: 'Restock',
        metadata: { product }
      });
    });

  // Critical: Overdue Payments
  if (transactionStats?.paymentsOverdue && transactionStats.paymentsOverdue > 0) {
    const overdueAmount = transactionStats.paymentsOverdueAmount || 0;
    const formattedAmount = overdueAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    todoItems.push({
      id: 'transaction-overdue-payments',
      type: 'transaction',
      priority: 'critical',
      title: '⚠️ Overdue Payments',
      description: `${transactionStats!.paymentsOverdue} payment${transactionStats!.paymentsOverdue !== 1 ? 's' : ''} past due totaling ₱${formattedAmount} - immediate collection required`,
      count: transactionStats!.paymentsOverdue,
      icon: DollarSign,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      action: () => openTransactionActionsModal('payments_overdue'),
      actionLabel: 'View',
    });
  }

  // HIGH PRIORITY
  // High: Stock Count Sessions (100% complete - ready to finalize)
  if (stockCountStats?.activeSessionsCount > 0) {
    stockCountStats.activeSessions
      .filter((session: any) => {
        const progress = session.totalLines > 0
          ? Math.round((session.countedLines / session.totalLines) * 100)
          : 0;
        return progress === 100;
      })
      .forEach((session: any) => {
        todoItems.push({
          id: `stock-count-ready-${session.id}`,
          type: 'stock_count',
          priority: 'high',
          title: `Finalize Stock Count ${session.sessionNumber}`,
          description: `${session.locationName} - All items counted, ready to finalize`,
          icon: CheckCircle,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
          action: () => navigate(`/stock-count/${session.id}`),
          actionLabel: 'Finalize',
          metadata: { session }
        });
      });
  }

  // High: Pending Inventory Adjustments
  if (adjustmentStats?.pending > 0) {
    const { overage = 0, shortage = 0, locationCorrection = 0 } = adjustmentStats.byType || {};
    const summary = [
      overage > 0 && `${overage} overage${overage !== 1 ? 's' : ''}`,
      shortage > 0 && `${shortage} shortage${shortage !== 1 ? 's' : ''}`,
      locationCorrection > 0 && `${locationCorrection} location mismatch${locationCorrection !== 1 ? 'es' : ''}`
    ].filter(Boolean).join(', ');

    todoItems.push({
      id: 'adjustments-pending',
      type: 'adjustment',
      priority: 'high',
      title: 'Review Inventory Adjustments',
      description: `${adjustmentStats.pending} pending: ${summary}`,
      count: adjustmentStats.pending,
      icon: FileText,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-500',
      action: () => setIsAdjustmentsModalOpen(true),
      actionLabel: 'Review',
    });
  }

  // High: Low Stock items (available 1-4)
  lowStockProducts
    .filter((p: any) => p.stockLevel?.available > 0 && p.stockLevel?.available < 5)
    .forEach((product: any) => {
      todoItems.push({
        id: `low-stock-high-${product.id}`,
        type: 'low_stock',
        priority: 'high',
        title: `Low Stock: ${product.name}`,
        description: `Only ${product.stockLevel.available} units available`,
        icon: TrendingDown,
        iconColor: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500',
        action: () => {
          setSelectedProduct({
            id: product.id,
            name: product.name,
            currentStock: product.stockLevel?.available || 0
          });
          setIsRestockingMethodModalOpen(true);
        },
        actionLabel: 'Restock',
        metadata: { product }
      });
    });

  // High: Restocking RFQs with Responses to Review
  if (restockingRfqStats?.responsesToReview > 0) {
    todoItems.push({
      id: 'restocking-rfq-responses',
      type: 'restocking_rfq',
      priority: 'high',
      title: 'Review Restocking RFQ Responses',
      description: `${restockingRfqStats.responsesToReview} RFQ${restockingRfqStats.responsesToReview !== 1 ? 's have' : ' has'} received supplier quotes`,
      count: restockingRfqStats.responsesToReview,
      icon: FileText,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      action: () => setIsRFQResponsesModalOpen(true),
      actionLabel: 'Review',
    });
  }

  // High: Stock Allocation Opportunities (NEW - Manual Allocation Feature)
  if (allocationStats?.pendingOpportunities > 0) {
    todoItems.push({
      id: 'allocation-opportunities',
      type: 'procurement',
      priority: 'high',
      title: '🎯 Allocate Received Stock',
      description: `${allocationStats.pendingOpportunities} stock allocation${allocationStats.pendingOpportunities !== 1 ? 's' : ''} awaiting your review - ${allocationStats.waitingTransactions} transaction${allocationStats.waitingTransactions !== 1 ? 's' : ''} waiting`,
      count: allocationStats.pendingOpportunities,
      icon: Package,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      action: () => setIsAllocationModalOpen(true),
      actionLabel: 'Review',
    });
  }

  // High: Downloaded POs Needing Confirmation
  posNeedingFollowUp.forEach((po: any) => {
    const calculateHoursSince = (dateString: string) => {
      const now = new Date();
      const downloaded = new Date(dateString);
      return Math.floor((now.getTime() - downloaded.getTime()) / (1000 * 60 * 60));
    };

    const formatTimeAgo = (dateString: string) => {
      const hours = calculateHoursSince(dateString);
      const days = Math.floor(hours / 24);
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      return 'Just now';
    };

    const hoursSinceDownload = po.lastDownloadedAt ? calculateHoursSince(po.lastDownloadedAt) : 0;

    todoItems.push({
      id: `po-confirm-sent-${po.id}`,
      type: 'procurement',
      priority: hoursSinceDownload > 48 ? 'high' : 'medium',
      title: `Did you send PO ${po.poNumber}?`,
      description: `Downloaded ${formatTimeAgo(po.lastDownloadedAt)} for ${po.supplier?.name || 'supplier'}`,
      icon: AlertTriangle,
      iconColor: hoursSinceDownload > 48 ? 'text-orange-600' : 'text-yellow-600',
      bgColor: hoursSinceDownload > 48 ? 'bg-orange-50' : 'bg-yellow-50',
      borderColor: hoursSinceDownload > 48 ? 'border-orange-500' : 'border-yellow-500',
      action: () => {
        setSelectedPOForConfirm(po);
        setIsConfirmPOModalOpen(true);
      },
      actionLabel: 'Confirm',
      metadata: { po }
    });
  });

  // High: Quotes Expiring Soon
  if (transactionStats?.quotesExpiringSoon && transactionStats.quotesExpiringSoon > 0) {
    todoItems.push({
      id: 'transaction-quotes-expiring',
      type: 'transaction',
      priority: 'high',
      title: '⏰ Quotes Expiring Soon',
      description: `${transactionStats!.quotesExpiringSoon} quote${transactionStats!.quotesExpiringSoon !== 1 ? 's' : ''} expiring within 7 days`,
      count: transactionStats!.quotesExpiringSoon,
      icon: Clock,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      action: () => openTransactionActionsModal('quotes_expiring_soon'),
      actionLabel: 'Follow Up',
    });
  }

  // MEDIUM PRIORITY
  // Medium: Restocking RFQs Awaiting Responses
  if (restockingRfqStats?.awaitingResponses > 0) {
    const pendingCount = restockingRfqStats.pendingCount || 0;
    const receivedCount = restockingRfqStats.receivedCount || 0;

    todoItems.push({
      id: 'restocking-rfq-awaiting',
      type: 'restocking_rfq',
      priority: 'medium',
      title: 'Restocking RFQs Awaiting Supplier Responses',
      description: `${restockingRfqStats.awaitingResponses} RFQ${restockingRfqStats.awaitingResponses !== 1 ? 's' : ''}: ${pendingCount} pending, ${receivedCount} received`,
      count: restockingRfqStats.awaitingResponses,
      icon: Clock,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      action: () => setIsRFQAwaitingModalOpen(true),
      actionLabel: 'View',
    });
  }

  // MEDIUM PRIORITY
  // Medium: Stock Count Sessions (in progress)
  if (stockCountStats?.activeSessionsCount > 0) {
    stockCountStats.activeSessions
      .filter((session: any) => {
        const progress = session.totalLines > 0
          ? Math.round((session.countedLines / session.totalLines) * 100)
          : 0;
        return progress < 100;
      })
      .forEach((session: any) => {
        const progress = session.totalLines > 0
          ? Math.round((session.countedLines / session.totalLines) * 100)
          : 0;

        todoItems.push({
          id: `stock-count-${session.id}`,
          type: 'stock_count',
          priority: 'medium',
          title: `Continue Stock Count ${session.sessionNumber}`,
          description: `${session.locationName} - ${session.countedLines}/${session.totalLines} counted (${progress}%)`,
          icon: ClipboardCheck,
          iconColor: 'text-teal-600',
          bgColor: 'bg-teal-50',
          borderColor: 'border-teal-500',
          action: () => navigate(`/stock-count/${session.id}`),
          actionLabel: 'Continue',
          metadata: { session }
        });
      });
  }

  // Medium: Procurement - Send Restocking POs
  if (restockingStats?.toSend > 0) {
    todoItems.push({
      id: 'procurement-send-restocking',
      type: 'procurement',
      priority: 'medium',
      title: 'Send Restocking Purchase Orders',
      description: `${restockingStats.toSend} draft PO${restockingStats.toSend !== 1 ? 's' : ''} ready to send to suppliers`,
      count: restockingStats.toSend,
      icon: Send,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      action: () => setIsSendPOsModalOpen(true),
      actionLabel: 'Send',
    });
  }

  // Medium: Procurement - Receive Restocking POs
  if (restockingStats?.toReceive > 0) {
    todoItems.push({
      id: 'procurement-receive-restocking',
      type: 'procurement',
      priority: 'medium',
      title: 'Receive Restocking Orders',
      description: `${restockingStats.toReceive} PO${restockingStats.toReceive !== 1 ? 's' : ''} awaiting receipt`,
      count: restockingStats.toReceive,
      icon: Package,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      action: () => setIsReceivePOsModalOpen(true),
      actionLabel: 'Receive',
    });
  }

  // Medium: Transaction PO Actions
  if (transactionPOStats?.toSend > 0) {
    todoItems.push({
      id: 'procurement-send-transaction',
      type: 'procurement',
      priority: 'medium',
      title: 'Send Customer Transaction POs',
      description: `${transactionPOStats.toSend} draft PO${transactionPOStats.toSend !== 1 ? 's' : ''} for customer orders`,
      count: transactionPOStats.toSend,
      icon: ShoppingCart,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      action: () => setIsSendPOsModalOpen(true),
      actionLabel: 'Send',
    });
  }

  // Medium: Transaction POs - Confirm from Supplier
  if (transactionPOStats?.toConfirm > 0) {
    todoItems.push({
      id: 'procurement-confirm-transaction',
      type: 'procurement',
      priority: 'medium',
      title: 'Confirm Transaction Purchase Orders',
      description: `${transactionPOStats.toConfirm} PO${transactionPOStats.toConfirm !== 1 ? 's' : ''} sent to suppliers awaiting confirmation`,
      count: transactionPOStats.toConfirm,
      icon: CheckCircle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      action: () => setIsConfirmTransactionPOsModalOpen(true),
      actionLabel: 'View',
    });
  }

  // Medium: Transaction POs - Receive Goods
  if (transactionPOStats?.toReceive > 0) {
    todoItems.push({
      id: 'procurement-receive-transaction',
      type: 'procurement',
      priority: 'medium',
      title: 'Receive Customer Order Items',
      description: `${transactionPOStats.toReceive} confirmed PO${transactionPOStats.toReceive !== 1 ? 's' : ''} ready for receipt`,
      count: transactionPOStats.toReceive,
      icon: Package,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      action: () => setIsReceiveTransactionPOsModalOpen(true),
      actionLabel: 'Receive',
    });
  }

  // Medium: Transactions - Generate Quotes (Stocked Products)
  if (transactionStats?.needClientQuotes && transactionStats.needClientQuotes > 0) {
    todoItems.push({
      id: 'transaction-generate-quotes',
      type: 'transaction',
      priority: 'medium',
      title: 'Generate Client Quotes',
      description: `${transactionStats!.needClientQuotes} transaction${transactionStats!.needClientQuotes !== 1 ? 's' : ''} with stocked products ready for quoting`,
      count: transactionStats!.needClientQuotes,
      icon: FileText,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      action: () => openTransactionActionsModal('need_client_quotes'),
      actionLabel: 'View',
    });
  }

  // Medium: Transactions - Source for Client Orders (Non-Stocked Products)
  if (transactionStats?.needSourcingForOrders && transactionStats.needSourcingForOrders > 0) {
    todoItems.push({
      id: 'transaction-source-orders',
      type: 'transaction',
      priority: 'medium',
      title: 'Source Products for Client Orders',
      description: `${transactionStats!.needSourcingForOrders} transaction${transactionStats!.needSourcingForOrders !== 1 ? 's have' : ' has'} non-stocked products requiring supplier sourcing`,
      count: transactionStats!.needSourcingForOrders,
      icon: ShoppingCart,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      action: () => openTransactionActionsModal('need_sourcing'),
      actionLabel: 'Source',
    });
  }

  // Medium: Transactions - Waiting for Restocking POs
  if (transactionStats?.waitingForRestockingPOs && transactionStats.waitingForRestockingPOs > 0) {
    todoItems.push({
      id: 'transaction-waiting-restocking',
      type: 'transaction',
      priority: 'medium',
      title: '⏳ Transactions Waiting for Restocking',
      description: `${transactionStats!.waitingForRestockingPOs} transaction${transactionStats!.waitingForRestockingPOs !== 1 ? 's are' : ' is'} waiting for pending restocking POs to arrive`,
      count: transactionStats!.waitingForRestockingPOs,
      icon: Clock,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-500',
      action: () => openTransactionActionsModal('waiting_for_restocking'),
      actionLabel: 'View',
    });
  }

  // Medium: Transactions - Send Quotes
  if (transactionStats?.quotesCanBeSent && transactionStats.quotesCanBeSent > 0) {
    todoItems.push({
      id: 'transaction-send-quotes',
      type: 'transaction',
      priority: 'medium',
      title: 'Send Client Quotes',
      description: `${transactionStats!.quotesCanBeSent} draft quote${transactionStats!.quotesCanBeSent !== 1 ? 's' : ''} ready to send`,
      count: transactionStats!.quotesCanBeSent,
      icon: Send,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      action: () => openTransactionActionsModal('quotes_can_be_sent'),
      actionLabel: 'View',
    });
  }

  // Medium: Transactions - Accept Quotes
  if (transactionStats?.quotesCanBeAccepted && transactionStats.quotesCanBeAccepted > 0) {
    todoItems.push({
      id: 'transaction-accept-quotes',
      type: 'transaction',
      priority: 'medium',
      title: 'Accept Client Quotes',
      description: `${transactionStats!.quotesCanBeAccepted} quote${transactionStats!.quotesCanBeAccepted !== 1 ? 's' : ''} awaiting acceptance`,
      count: transactionStats!.quotesCanBeAccepted,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      action: () => openTransactionActionsModal('quotes_can_be_accepted'),
      actionLabel: 'View',
    });
  }

  // Medium: Transactions - Ship Orders
  if (transactionStats?.canShip && transactionStats.canShip > 0) {
    todoItems.push({
      id: 'transaction-ship',
      type: 'transaction',
      priority: 'medium',
      title: 'Mark Orders as Shipped',
      description: `${transactionStats!.canShip} order${transactionStats!.canShip !== 1 ? 's' : ''} ready for delivery`,
      count: transactionStats!.canShip,
      icon: Truck,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      action: () => openTransactionActionsModal('can_ship'),
      actionLabel: 'View',
    });
  }

  // Medium: Transactions - Confirm Delivery
  if (transactionStats?.canDeliver && transactionStats.canDeliver > 0) {
    todoItems.push({
      id: 'transaction-deliver',
      type: 'transaction',
      priority: 'medium',
      title: 'Confirm Deliveries',
      description: `${transactionStats!.canDeliver} order${transactionStats!.canDeliver !== 1 ? 's' : ''} out for delivery`,
      count: transactionStats!.canDeliver,
      icon: Package,
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-500',
      action: () => openTransactionActionsModal('can_deliver'),
      actionLabel: 'View',
    });
  }

  // Medium: Transactions - Generate Invoices
  if (transactionStats?.canGenerateInvoice && transactionStats.canGenerateInvoice > 0) {
    const invoiceAmount = transactionStats.canGenerateInvoiceAmount || 0;
    const formattedAmount = invoiceAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    todoItems.push({
      id: 'transaction-generate-invoice',
      type: 'transaction',
      priority: 'medium',
      title: 'Generate Invoices',
      description: `${transactionStats!.canGenerateInvoice} delivered order${transactionStats!.canGenerateInvoice !== 1 ? 's' : ''} ready for invoicing (₱${formattedAmount})`,
      count: transactionStats!.canGenerateInvoice,
      icon: DollarSign,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      action: () => openTransactionActionsModal('can_generate_invoice'),
      actionLabel: 'View',
    });
  }

  // Medium: Transactions - Send Invoices
  if (transactionStats?.canSendInvoice && transactionStats.canSendInvoice > 0) {
    const sendInvoiceAmount = transactionStats.canSendInvoiceAmount || 0;
    const formattedAmount = sendInvoiceAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    todoItems.push({
      id: 'transaction-send-invoice',
      type: 'transaction',
      priority: 'medium',
      title: 'Send Invoices',
      description: `${transactionStats!.canSendInvoice} draft invoice${transactionStats!.canSendInvoice !== 1 ? 's' : ''} ready to send (₱${formattedAmount})`,
      count: transactionStats!.canSendInvoice,
      icon: Send,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      action: () => openTransactionActionsModal('can_send_invoice'),
      actionLabel: 'View',
    });
  }

  // Medium: Payments Due Today
  if (transactionStats?.paymentsDueToday && transactionStats.paymentsDueToday > 0) {
    const paymentsDueTodayAmount = transactionStats.paymentsDueTodayAmount || 0;
    const formattedAmount = paymentsDueTodayAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    todoItems.push({
      id: 'transaction-payments-due',
      type: 'transaction',
      priority: 'medium',
      title: 'Payments Due Today',
      description: `${transactionStats!.paymentsDueToday} payment${transactionStats!.paymentsDueToday !== 1 ? 's' : ''} due today totaling ₱${formattedAmount}`,
      count: transactionStats!.paymentsDueToday,
      icon: Clock,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      action: () => openTransactionActionsModal('payments_due_today'),
      actionLabel: 'View',
    });
  }

  // LOW PRIORITY
  // Low: Incomplete Master Data
  if (incompleteStats && incompleteStats.totalIncomplete > 0) {
    const criticalCount =
      (incompleteStats.suppliers?.missingEmail || 0) +
      (incompleteStats.clients?.missingContact || 0);

    // Build description with each entity type on separate line, show blocking status
    const descriptionParts = [];

    if (incompleteStats.products?.total > 0) {
      descriptionParts.push(
        `${incompleteStats.products.total} Product${incompleteStats.products.total !== 1 ? 's' : ''} Missing Details`
      );
    }

    if (incompleteStats.suppliers?.total > 0) {
      const blocksWorkflow = incompleteStats.suppliers.missingEmail > 0;
      descriptionParts.push(
        `${incompleteStats.suppliers.total} Supplier${incompleteStats.suppliers.total !== 1 ? 's' : ''} Missing Details${blocksWorkflow ? ' (Blocks workflow)' : ''}`
      );
    }

    if (incompleteStats.clients?.total > 0) {
      const blocksWorkflow = incompleteStats.clients.missingContact > 0;
      descriptionParts.push(
        `${incompleteStats.clients.total} Client${incompleteStats.clients.total !== 1 ? 's' : ''} Missing Details${blocksWorkflow ? ' (Blocks workflow)' : ''}`
      );
    }

    todoItems.push({
      id: 'incomplete-master-data',
      type: 'low_stock', // Using existing type for now
      priority: criticalCount > 0 ? 'high' : 'low',
      title: criticalCount > 0 ? '⚠️ Complete Critical Master Data' : 'Complete Master Data',
      description: descriptionParts.join('\n'),
      count: incompleteStats.totalIncomplete,
      icon: FileText,
      iconColor: criticalCount > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: criticalCount > 0 ? 'bg-red-50' : 'bg-gray-50',
      borderColor: criticalCount > 0 ? 'border-red-500' : 'border-gray-500',
      action: () => setIsIncompleteMasterDataModalOpen(true),
      actionLabel: 'Review',
    });
  }

  // Low: Products Missing Alert Stock Levels
  if (productsMissingAlerts && productsMissingAlerts.length > 0) {
    todoItems.push({
      id: 'products-missing-alert-levels',
      type: 'low_stock',
      priority: 'low',
      title: 'Set Stock Alert Levels',
      description: `${productsMissingAlerts.length} stocked product${productsMissingAlerts.length !== 1 ? 's' : ''} need${productsMissingAlerts.length === 1 ? 's' : ''} alert thresholds configured`,
      count: productsMissingAlerts.length,
      icon: AlertTriangle,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-500',
      action: () => setIsSetAlertLevelsModalOpen(true),
      actionLabel: 'Configure',
    });
  }

  // Low: Medium Stock items (5-9 units) - NO LONGER NEEDED
  // Products are now only tracked based on their configured alertStockLevel
  // This hardcoded "5-9 units" logic is removed to avoid confusion

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  todoItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Count by priority
  const criticalCount = todoItems.filter(t => t.priority === 'critical').length;
  const highCount = todoItems.filter(t => t.priority === 'high').length;
  const mediumCount = todoItems.filter(t => t.priority === 'medium').length;
  const totalCount = todoItems.length;

  if (totalCount === 0) {
    return (
      <div className="border-2 border-green-300 bg-green-50 rounded-lg p-8">
        <div className="flex items-center gap-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
          <div>
            <h3 className="text-2xl font-bold text-green-900">All Caught Up! 🎉</h3>
            <p className="text-base text-green-700 mt-1">
              No pending actions required at this time
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-7 py-5 border-b-2 border-gray-300">
          <div className="flex items-center gap-4">
            <ListTodo className="w-7 h-7 text-gray-700" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Tasks</h3>
              <div className="flex items-center gap-3 text-base text-gray-600 mt-1">
                <span>{totalCount} item{totalCount !== 1 ? 's' : ''} requiring attention</span>
                {criticalCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold">
                    🔴 {criticalCount} Critical
                  </span>
                )}
                {highCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-sm font-semibold">
                    🟠 {highCount} High
                  </span>
                )}
                {mediumCount > 0 && (
                  <span className="text-sm text-gray-500">
                    {mediumCount} medium priority
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TODO List */}
        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {todoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`px-7 py-4 hover:bg-gray-50 transition-colors border-l-4 ${item.borderColor}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      <Icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base mb-1 truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Priority Badge */}
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium ${
                          item.priority === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : item.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : item.priority === 'medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.priority === 'critical' ? '🔴' : item.priority === 'high' ? '🟠' : item.priority === 'medium' ? '🔵' : '⚪'} {item.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={item.action}
                    className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      item.priority === 'critical'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : item.priority === 'high'
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {item.actionLabel}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setIsRestockModalOpen(false);
          setSelectedProduct(null);
          queryClient.invalidateQueries({ queryKey: ['products', 'low-stock'] });
        }}
        prefilledProduct={selectedProduct || undefined}
      />

      <AdjustmentApprovalModal
        isOpen={isAdjustmentsModalOpen}
        onClose={() => setIsAdjustmentsModalOpen(false)}
      />

      {/* Restocking RFQ Modals */}
      <RestockingRFQListModal
        isOpen={isRFQResponsesModalOpen}
        onClose={() => setIsRFQResponsesModalOpen(false)}
        filter="responses"
      />

      <RestockingRFQListModal
        isOpen={isRFQAwaitingModalOpen}
        onClose={() => setIsRFQAwaitingModalOpen(false)}
        filter="awaiting"
      />

      {/* Procurement Modals */}
      <SendPurchaseOrdersModal
        isOpen={isSendPOsModalOpen}
        onClose={() => setIsSendPOsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['restocking-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['transaction-fulfillment-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          setIsSendPOsModalOpen(false);
        }}
      />

      <ReceivePurchaseOrdersModal
        isOpen={isReceivePOsModalOpen}
        onClose={() => setIsReceivePOsModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['restocking-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['transaction-fulfillment-po-stats'] });
          queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
          setIsReceivePOsModalOpen(false);
        }}
      />

      {/* Restocking Method Choice Modal */}
      {isRestockingMethodModalOpen && (
        <RestockingMethodModal
          isOpen={isRestockingMethodModalOpen}
          onClose={() => {
            setIsRestockingMethodModalOpen(false);
            setSelectedProduct(null);
          }}
          onSelectMethod={handleRestockMethodSelection}
        />
      )}

      {/* Restocking RFQ Modal */}
      <RestockingRFQModal
        isOpen={isRestockingRFQModalOpen}
        onClose={() => {
          setIsRestockingRFQModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['restocking-rfq-stats'] });
          queryClient.invalidateQueries({ queryKey: ['restocking-rfqs'] });
          setIsRestockingRFQModalOpen(false);
          setSelectedProduct(null);
        }}
        prefilledProduct={selectedProduct || undefined}
      />

      {/* Incomplete Master Data Modal */}
      <IncompleteMasterDataModal
        isOpen={isIncompleteMasterDataModalOpen}
        onClose={() => setIsIncompleteMasterDataModalOpen(false)}
        initialTab="products"
      />

      {/* Set Alert Levels Modal */}
      <SetAlertLevelsModal
        isOpen={isSetAlertLevelsModalOpen}
        onClose={() => setIsSetAlertLevelsModalOpen(false)}
      />

      {/* Transaction Actions Modal */}
      <TransactionActionsModal
        isOpen={isTransactionActionsModalOpen}
        onClose={() => {
          setIsTransactionActionsModalOpen(false);
          setSelectedActionType(null);
        }}
        actionType={selectedActionType}
      />

      {/* Confirm PO Sent Modal */}
      {selectedPOForConfirm && (
        <ConfirmPOSentModal
          isOpen={isConfirmPOModalOpen}
          onClose={() => {
            setIsConfirmPOModalOpen(false);
            setSelectedPOForConfirm(null);
          }}
          purchaseOrder={selectedPOForConfirm}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['pos-needs-followup'] });
            queryClient.invalidateQueries({ queryKey: ['restocking-po-stats'] });
            queryClient.invalidateQueries({ queryKey: ['transaction-fulfillment-po-stats'] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['restocking-rfq-stats'] });
          }}
        />
      )}

      {/* Allocation Opportunities Modal */}
      <AllocationOpportunitiesModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['allocation-opportunities-stats'] });
          queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });
          queryClient.invalidateQueries({ queryKey: ['products', 'low-stock'] });
          setIsAllocationModalOpen(false);
        }}
      />

      {/* Transaction PO Actions Modals */}
      <TransactionPOActionsModal
        isOpen={isConfirmTransactionPOsModalOpen}
        onClose={() => setIsConfirmTransactionPOsModalOpen(false)}
        mode="confirm"
      />

      <TransactionPOActionsModal
        isOpen={isReceiveTransactionPOsModalOpen}
        onClose={() => setIsReceiveTransactionPOsModalOpen(false)}
        mode="receive"
      />
    </>
  );
}
