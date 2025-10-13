import { Check, Lock, AlertCircle, FileText, DollarSign, Package, Truck, CheckCircle } from 'lucide-react';
import { TransactionStatus } from '../../lib/api/transactions';

interface TransactionProgressGuideProps {
  transaction: any;
  clientQuotes: any[];
  supplierQuotes: any[];
  purchaseOrders: any[];
  fulfillment: any;
  invoices: any[];
}

interface WorkflowStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  instructions: string[];
  substeps?: { label: string; completed: boolean }[];
  status: 'completed' | 'active' | 'locked';
}

export function TransactionProgressGuide({
  transaction,
  clientQuotes,
  supplierQuotes,
  purchaseOrders,
  fulfillment,
  invoices,
}: TransactionProgressGuideProps) {
  const getWorkflowSteps = (): WorkflowStep[] => {
    const status = transaction.status;
    const itemsRequiringSourcing = transaction.lineItems?.filter((item: any) => item.requiresSourcing) || [];
    const hasItemsRequiringSourcing = itemsRequiringSourcing.length > 0;

    // Check substep completion
    const allItemsHaveQuotes = itemsRequiringSourcing.every((item: any) =>
      supplierQuotes.some(q => q.lineItem.product.id === item.product.id)
    );
    const hasClientQuote = clientQuotes.length > 0;
    const hasSentQuote = clientQuotes.some(q => q.status === 'sent');
    const hasAcceptedQuote = clientQuotes.some(q => q.status === 'accepted');
    const allPOsConfirmed = purchaseOrders.length > 0 && purchaseOrders.every(po =>
      po.status === 'confirmed' || po.status === 'received' || po.status === 'partially_received'
    );
    const allPOsReceived = purchaseOrders.length > 0 && purchaseOrders.every(po => po.status === 'received');
    const isShipped = fulfillment?.status === 'out_for_delivery' || fulfillment?.status === 'delivered';
    const isDelivered = fulfillment?.status === 'delivered';
    const hasInvoice = invoices.length > 0;
    const invoiceSent = invoices.some(inv => inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'paid');
    const isPaid = invoices.some(inv => inv.status === 'paid');

    const steps: WorkflowStep[] = [];

    // Step 1: Sourcing (only if items require sourcing)
    if (hasItemsRequiringSourcing) {
      steps.push({
        id: 'sourcing',
        title: 'Get Supplier Quotes',
        icon: <FileText className="w-5 h-5" />,
        description: `You need to source ${itemsRequiringSourcing.length} ${itemsRequiringSourcing.length === 1 ? 'product' : 'products'} from suppliers.`,
        instructions: [
          `You don't have enough stock for some items in this order.`,
          `Click "Add Supplier Quote" in the Quoting section below.`,
          `Enter the price and delivery time from each supplier.`,
          `Get quotes from at least 2-3 suppliers to compare prices.`,
        ],
        substeps: itemsRequiringSourcing.map((item: any) => ({
          label: `Get quotes for ${item.product.name}`,
          completed: supplierQuotes.some(q => q.lineItem.product.id === item.product.id)
        })),
        status: [TransactionStatus.DRAFT, TransactionStatus.SOURCING].includes(status as any) ? 'active' : 'completed'
      });
    }

    // Step 2: Create Client Quote
    steps.push({
      id: 'client-quote',
      title: 'Create Quote for Client',
      icon: <DollarSign className="w-5 h-5" />,
      description: `Prepare a formal price quote to send to ${transaction.client?.name || 'the client'}.`,
      instructions: [
        hasItemsRequiringSourcing && !allItemsHaveQuotes
          ? `⚠️ Wait until you have supplier quotes for all items before creating the client quote.`
          : `All cost information is ready. You can now create the client quote.`,
        `Scroll down to the "Client Quotation Summary" section.`,
        `Click "Generate Formal Quote".`,
        `Review the prices and add your markup (profit margin).`,
        `Add payment terms and any special notes.`,
        `Click "Create Quote" to save it.`,
      ],
      substeps: [
        { label: 'Create the quote', completed: hasClientQuote },
        { label: 'Send quote to client', completed: hasSentQuote },
        { label: 'Wait for client to accept', completed: hasAcceptedQuote },
      ],
      status:
        [TransactionStatus.DRAFT, TransactionStatus.SOURCING].includes(status as any) && (!hasItemsRequiringSourcing || allItemsHaveQuotes)
          ? 'active'
          : [TransactionStatus.QUOTED, TransactionStatus.ACCEPTED].includes(status as any) || hasAcceptedQuote
          ? hasAcceptedQuote ? 'completed' : 'active'
          : hasAcceptedQuote ? 'completed' : 'locked'
    });

    // Step 3: Procurement (only if items require sourcing)
    if (hasItemsRequiringSourcing) {
      steps.push({
        id: 'procurement',
        title: 'Order from Suppliers',
        icon: <Package className="w-5 h-5" />,
        description: 'Purchase the items you need from your suppliers.',
        instructions:
          !hasAcceptedQuote
            ? [`⚠️ You can only order from suppliers after the client accepts your quote.`]
            : [
              `The system has created purchase orders based on the supplier quotes you selected.`,
              `Go to the "Procurement" section below.`,
              `Review each purchase order and click "Submit to Supplier".`,
              `Wait for suppliers to confirm the orders.`,
              `When items arrive, click "Receive Goods" and count the items.`,
              `Enter the quantities received and click "Complete Receipt".`,
            ],
        substeps: purchaseOrders.length > 0 ? purchaseOrders.map((po: any) => ({
          label: `${po.poNumber} - ${po.supplier?.name || 'Supplier'}`,
          completed: po.status === 'received'
        })) : [{ label: 'No purchase orders created yet', completed: false }],
        status:
          !hasAcceptedQuote
            ? 'locked'
            : [TransactionStatus.ACCEPTED, TransactionStatus.PARTIALLY_ALLOCATED, TransactionStatus.WAITING_FOR_ITEMS].includes(status as any)
            ? 'active'
            : allPOsReceived
            ? 'completed'
            : 'active'
      });
    }

    // Step 4: Prepare for Delivery
    steps.push({
      id: 'fulfillment-prep',
      title: 'Prepare Order for Delivery',
      icon: <Package className="w-5 h-5" />,
      description: 'Get the items ready to deliver to the client.',
      instructions:
        status !== TransactionStatus.READY_FOR_DELIVERY
          ? [
            hasItemsRequiringSourcing
              ? `⚠️ Wait for all supplier deliveries to arrive before preparing the order.`
              : `⚠️ Wait for the client to accept your quote.`
          ]
          : [
            `All items are ready! Time to prepare the delivery.`,
            `Gather all items from your warehouse.`,
            `Check quantities carefully - make sure everything is correct.`,
            `Package the items securely for transport.`,
            `Prepare any delivery documents (packing slip, etc.).`,
          ],
      substeps: transaction.lineItems?.map((item: any) => ({
        label: `${item.product.name} - ${item.allocatedQuantity || 0}/${item.quantity} ready`,
        completed: (item.allocatedQuantity || 0) >= item.quantity
      })) || [],
      status:
        status === TransactionStatus.READY_FOR_DELIVERY
          ? 'active'
          : [
            TransactionStatus.OUT_FOR_DELIVERY,
            TransactionStatus.DELIVERED,
            TransactionStatus.COMPLETED
          ].includes(status as any)
          ? 'completed'
          : 'locked'
    });

    // Step 5: Ship and Deliver
    steps.push({
      id: 'delivery',
      title: 'Ship and Deliver Order',
      icon: <Truck className="w-5 h-5" />,
      description: `Deliver the order to ${transaction.client?.name || 'the client'}.`,
      instructions:
        status === TransactionStatus.READY_FOR_DELIVERY
          ? [
            `Go to the "Fulfillment" section below.`,
            `Click "Mark as Shipped" when the delivery is on its way.`,
            `Enter the estimated delivery date.`,
            `Add any shipping notes if needed.`,
          ]
          : status === TransactionStatus.OUT_FOR_DELIVERY
          ? [
            `Your delivery is on the way!`,
            `When the client receives the order, click "Mark as Delivered".`,
            `Make sure the client confirms they received everything.`,
          ]
          : [`⚠️ Complete the previous steps first.`],
      substeps: [
        { label: 'Mark as shipped', completed: isShipped },
        { label: 'Confirm delivery with client', completed: isDelivered },
      ],
      status:
        status === TransactionStatus.READY_FOR_DELIVERY || status === TransactionStatus.OUT_FOR_DELIVERY
          ? 'active'
          : status === TransactionStatus.DELIVERED || status === TransactionStatus.COMPLETED
          ? 'completed'
          : 'locked'
    });

    // Step 6: Invoice and Payment
    steps.push({
      id: 'invoicing',
      title: 'Bill the Client',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Create and send an invoice to get paid.',
      instructions:
        status === TransactionStatus.DELIVERED
          ? [
            `The order is delivered! Time to bill the client.`,
            `Go to the "Invoicing & Payments" section below.`,
            `Click "Generate Invoice".`,
            `Review the invoice details and click "Create".`,
            `Click "Send Invoice" to email it to the client.`,
            `Track payments as they come in.`,
          ]
          : status === TransactionStatus.COMPLETED
          ? [
            `Monitor payments from ${transaction.client?.name || 'the client'}.`,
            `When a payment is received, click "Record Payment".`,
            `Enter the amount, date, and payment method.`,
            `The invoice balance will update automatically.`,
          ]
          : [`⚠️ You can only invoice after the order is delivered.`],
      substeps: [
        { label: 'Generate invoice', completed: hasInvoice },
        { label: 'Send invoice to client', completed: invoiceSent },
        { label: 'Receive full payment', completed: isPaid },
      ],
      status:
        isPaid
          ? 'completed'
          : status === TransactionStatus.DELIVERED || status === TransactionStatus.COMPLETED
          ? 'active'
          : 'locked'
    });

    return steps;
  };

  const steps = getWorkflowSteps();
  const currentStep = steps.find(s => s.status === 'active');
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  // Check if transaction is fully complete (all steps done)
  const isFullyComplete = completedSteps === steps.length;

  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-7rem)] overflow-y-auto">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b border-blue-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-bold text-blue-900">What To Do Next</h2>
          <span className="text-[10px] sm:text-xs font-medium text-blue-700 whitespace-nowrap">
            {completedSteps}/{steps.length} Tasks Done
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 sm:h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current Step Details or Completion Message */}
      {isFullyComplete ? (
        <div className="px-3 sm:px-4 py-3 sm:py-4 bg-green-50 border-b border-green-200">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-green-900 mb-1">
                Transaction Complete!
              </h3>
              <p className="text-xs sm:text-sm text-green-800 mb-3">All done! This transaction is finished.</p>
              <div className="bg-white rounded-lg p-2 sm:p-3 border border-green-300">
                <p className="text-[10px] sm:text-xs text-gray-700">
                  ✅ Congratulations! This transaction is fully complete.<br/>
                  The client has received their delivery and paid in full.<br/>
                  You can view this transaction's history anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : currentStep ? (
        <div className="px-3 sm:px-4 py-3 sm:py-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900">
              {currentStep.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                {currentStep.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-3">{currentStep.description}</p>

              {/* Instructions */}
              <div className="bg-white rounded-lg p-2 sm:p-3 border border-yellow-300">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-xs sm:text-sm">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                  Instructions:
                </h4>
                <ol className="list-decimal list-inside space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-gray-700">
                  {currentStep.instructions.map((instruction, idx) => (
                    <li key={idx} className={instruction.startsWith('⚠️') ? 'text-orange-700 font-medium list-none' : ''}>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Substeps */}
              {currentStep.substeps && currentStep.substeps.length > 0 && (
                <div className="mt-2 sm:mt-3">
                  <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-[10px] sm:text-xs">Progress:</h4>
                  <div className="space-y-1">
                    {currentStep.substeps.map((substep, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <div className={`flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center mt-0.5 ${
                          substep.completed
                            ? 'bg-green-500 border-green-500'
                            : 'bg-white border-gray-300'
                        }`}>
                          {substep.completed && <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />}
                        </div>
                        <span className={substep.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                          {substep.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* All Steps Overview */}
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        <h4 className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2">Overall Progress:</h4>
        <div className="space-y-1 sm:space-y-1.5">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg transition-colors ${
                step.status === 'active'
                  ? 'bg-blue-50 border-2 border-blue-300'
                  : step.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Step Number/Icon */}
              <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs ${
                step.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : step.status === 'active'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-500'
              }`}>
                {step.status === 'completed' ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : step.status === 'locked' ? (
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                ) : (
                  idx + 1
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className={`font-semibold text-[10px] sm:text-xs truncate ${
                    step.status === 'active'
                      ? 'text-blue-900'
                      : step.status === 'completed'
                      ? 'text-green-900'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {step.status === 'active' && (
                    <span className="px-1 sm:px-1.5 py-0.5 bg-blue-500 text-white text-[8px] sm:text-[10px] font-medium rounded-full whitespace-nowrap">
                      Now
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
