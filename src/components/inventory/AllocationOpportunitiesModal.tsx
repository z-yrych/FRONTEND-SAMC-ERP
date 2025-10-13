import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { X, Package, CheckCircle, XCircle, AlertCircle, User, Calendar } from 'lucide-react';

interface WaitingTransaction {
  transactionId: string;
  transactionNumber: string;
  lineItemId: string;
  quantityNeeded: number;
  clientName: string;
  createdAt: string;
}

interface AllocationOpportunity {
  id: string;
  product: {
    id: string;
    name: string;
  };
  sourcePO: {
    id: string;
    poNumber: string;
    supplier: {
      name: string;
    };
  };
  quantityReceived: number;
  quantityAllocated: number;
  quantityRemaining: number;
  waitingTransactions: WaitingTransaction[];
  status: string;
  createdAt: string;
}

interface AllocationOpportunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AllocationOpportunitiesModal({
  isOpen,
  onClose,
  onSuccess,
}: AllocationOpportunitiesModalProps) {
  const queryClient = useQueryClient();
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [transactionQuantities, setTransactionQuantities] = useState<Map<string, number>>(new Map());

  // Fetch pending opportunities
  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['allocation-opportunities'],
    queryFn: async () => {
      const response = await api.get('/inventory/allocation-opportunities');
      return response.data;
    },
    enabled: isOpen,
  });

  // Allocate mutation
  const allocateMutation = useMutation({
    mutationFn: async ({
      opportunityId,
      allocations,
    }: {
      opportunityId: string;
      allocations: { transactionId: string; lineItemId: string; quantity: number }[];
    }) => {
      const response = await api.post(
        `/inventory/allocation-opportunities/${opportunityId}/allocate`,
        { allocations }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate allocation-related queries
      queryClient.invalidateQueries({ queryKey: ['allocation-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['allocation-opportunities-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stock'] });

      // Invalidate transaction queries for all affected transactions
      variables.allocations.forEach((allocation) => {
        queryClient.invalidateQueries({ queryKey: ['transaction', allocation.transactionId] });
        queryClient.invalidateQueries({ queryKey: ['transaction-pending-stock', allocation.transactionId] });
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      });

      onSuccess();
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      const response = await api.post(
        `/inventory/allocation-opportunities/${opportunityId}/dismiss`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['allocation-opportunities-stats'] });
      setSelectedOpportunity(null);
      setSelectedTransactions(new Set());
    },
  });

  // Get currently selected opportunity
  const currentOpportunity = opportunities.find((o: AllocationOpportunity) => o.id === selectedOpportunity);

  // Reset selections when opportunity changes
  useEffect(() => {
    if (currentOpportunity) {
      const quantities = new Map();
      currentOpportunity.waitingTransactions.forEach((wt: WaitingTransaction) => {
        quantities.set(wt.lineItemId, wt.quantityNeeded);
      });
      setTransactionQuantities(quantities);
    }
  }, [currentOpportunity]);

  // Toggle transaction selection
  const toggleTransaction = (lineItemId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(lineItemId)) {
      newSelected.delete(lineItemId);
    } else {
      newSelected.add(lineItemId);
    }
    setSelectedTransactions(newSelected);
  };

  // Calculate total allocation
  const calculateTotalAllocation = () => {
    let total = 0;
    selectedTransactions.forEach((lineItemId) => {
      total += transactionQuantities.get(lineItemId) || 0;
    });
    return total;
  };

  // Handle allocate
  const handleAllocate = async () => {
    if (!currentOpportunity || selectedTransactions.size === 0) return;

    const allocations = Array.from(selectedTransactions).map((lineItemId) => {
      const wt = currentOpportunity.waitingTransactions.find(
        (t: WaitingTransaction) => t.lineItemId === lineItemId
      )!;
      return {
        transactionId: wt.transactionId,
        lineItemId,
        quantity: transactionQuantities.get(lineItemId) || wt.quantityNeeded,
      };
    });

    await allocateMutation.mutateAsync({
      opportunityId: currentOpportunity.id,
      allocations,
    });

    // Reset and move to next opportunity
    setSelectedTransactions(new Set());
    if (opportunities.length > 1) {
      const nextOpp = opportunities.find((o: AllocationOpportunity) => o.id !== selectedOpportunity);
      setSelectedOpportunity(nextOpp?.id || null);
    } else {
      setSelectedOpportunity(null);
    }
  };

  // Handle dismiss
  const handleDismiss = async () => {
    if (!currentOpportunity) return;

    await dismissMutation.mutateAsync(currentOpportunity.id);

    // Move to next opportunity
    if (opportunities.length > 1) {
      const nextOpp = opportunities.find((o: AllocationOpportunity) => o.id !== selectedOpportunity);
      setSelectedOpportunity(nextOpp?.id || null);
    } else {
      setSelectedOpportunity(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Stock Allocation Opportunities</h2>
            <p className="text-sm text-gray-500 mt-1">
              {opportunities.length} pending allocation{opportunities.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending allocation opportunities at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Opportunity List */}
              {!selectedOpportunity && (
                <div className="grid gap-4">
                  {opportunities.map((opp: AllocationOpportunity) => (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOpportunity(opp.id)}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900">{opp.product.name}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Received: </span>
                              <span className="font-medium">{opp.quantityRemaining} units</span>
                            </div>
                            <div>
                              <span className="text-gray-600">From: </span>
                              <span className="font-medium">{opp.sourcePO.poNumber}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Supplier: </span>
                              <span className="font-medium">{opp.sourcePO.supplier.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Waiting Transactions: </span>
                              <span className="font-medium text-orange-600">
                                {opp.waitingTransactions.length}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Review →
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Opportunity Detail View */}
              {currentOpportunity && (
                <div className="space-y-6">
                  {/* Product Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-6 h-6 text-green-600" />
                          <h3 className="text-lg font-bold text-gray-900">{currentOpportunity.product.name}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Quantity Available</div>
                            <div className="text-2xl font-bold text-green-600">
                              {currentOpportunity.quantityRemaining}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Source PO</div>
                            <div className="font-semibold">{currentOpportunity.sourcePO.poNumber}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Supplier</div>
                            <div className="font-semibold">{currentOpportunity.sourcePO.supplier.name}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Waiting Transactions</div>
                            <div className="font-semibold text-orange-600">
                              {currentOpportunity.waitingTransactions.length}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedOpportunity(null);
                          setSelectedTransactions(new Set());
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Waiting Transactions */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Select transactions to allocate stock (oldest first):
                    </h4>
                    <div className="space-y-2">
                      {currentOpportunity.waitingTransactions.map((wt: WaitingTransaction) => {
                        const isSelected = selectedTransactions.has(wt.lineItemId);
                        const totalSelected = calculateTotalAllocation();
                        const remaining = currentOpportunity.quantityRemaining - totalSelected;
                        const canSelect = !isSelected && remaining >= wt.quantityNeeded;

                        return (
                          <div
                            key={wt.lineItemId}
                            className={`border-2 rounded-lg p-4 transition-all ${
                              isSelected
                                ? 'border-green-500 bg-green-50'
                                : canSelect
                                ? 'border-gray-200 hover:border-green-300 hover:bg-green-50 cursor-pointer'
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                            onClick={() => canSelect && toggleTransaction(wt.lineItemId)}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => canSelect && toggleTransaction(wt.lineItemId)}
                                disabled={!canSelect && !isSelected}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <div className="text-xs text-gray-600">Transaction</div>
                                  <div className="font-semibold text-green-600">
                                    {wt.transactionNumber}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600">Client</div>
                                  <div className="font-medium">{wt.clientName}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600">Quantity Needed</div>
                                  <div className="font-semibold text-orange-600">
                                    {wt.quantityNeeded} units
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-600">Created</div>
                                  <div className="text-sm">
                                    {new Date(wt.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Allocation Summary */}
                  {selectedTransactions.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Allocation Summary</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-blue-700">Transactions Selected</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {selectedTransactions.size}
                          </div>
                        </div>
                        <div>
                          <div className="text-blue-700">Total Allocating</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {calculateTotalAllocation()}
                          </div>
                        </div>
                        <div>
                          <div className="text-blue-700">Remaining</div>
                          <div className="text-2xl font-bold text-blue-900">
                            {currentOpportunity.quantityRemaining - calculateTotalAllocation()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAllocate}
                      disabled={selectedTransactions.size === 0 || allocateMutation.isPending}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {allocateMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Allocating...
                        </span>
                      ) : (
                        `Allocate to ${selectedTransactions.size} Transaction${
                          selectedTransactions.size !== 1 ? 's' : ''
                        }`
                      )}
                    </button>
                    <button
                      onClick={handleDismiss}
                      disabled={dismissMutation.isPending}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
