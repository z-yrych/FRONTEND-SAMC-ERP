import { useState } from 'react';
import { X, Clock, Package, Building2, Mail, Calendar, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getRestockingRFQs, type RestockingRFQ } from '../../lib/api/restocking-rfq';
import { RestockingRFQDetailModal } from './RestockingRFQDetailModal';

interface RestockingRFQListModalProps {
  isOpen: boolean;
  onClose: () => void;
  filter?: 'awaiting' | 'responses' | 'all';
}

export function RestockingRFQListModal({
  isOpen,
  onClose,
  filter = 'all'
}: RestockingRFQListModalProps) {
  const [selectedRFQ, setSelectedRFQ] = useState<RestockingRFQ | null>(null);

  const { data: allRFQs = [], isLoading } = useQuery({
    queryKey: ['restocking-rfqs'],
    queryFn: getRestockingRFQs,
    enabled: isOpen
  });

  if (!isOpen) return null;

  // Filter RFQs based on filter prop
  const filteredRFQs = allRFQs.filter(rfq => {
    if (filter === 'awaiting') {
      // Show sent RFQs with pending responses
      return rfq.status === 'sent' && rfq.responses.some(r => r.status === 'pending');
    } else if (filter === 'responses') {
      // Show RFQs with received responses
      return rfq.responses.some(r => r.status === 'received');
    }
    return true; // 'all'
  });

  const getTitle = () => {
    if (filter === 'awaiting') return 'Restocking RFQs Awaiting Responses';
    if (filter === 'responses') return 'Restocking RFQs with Responses';
    return 'All Restocking RFQs';
  };

  const getDescription = () => {
    if (filter === 'awaiting') return 'These RFQs are waiting for supplier quotes';
    if (filter === 'responses') return 'These RFQs have received supplier responses';
    return 'View all restocking RFQs';
  };

  const handleRFQClick = (rfq: RestockingRFQ) => {
    setSelectedRFQ(rfq);
  };

  const handleDetailModalClose = () => {
    setSelectedRFQ(null);
  };

  const getPendingCount = (rfq: RestockingRFQ) => {
    return rfq.responses.filter(r => r.status === 'pending').length;
  };

  const getReceivedCount = (rfq: RestockingRFQ) => {
    return rfq.responses.filter(r => r.status === 'received').length;
  };

  const getDaysAgo = (date: string) => {
    const now = new Date();
    const sentDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - sentDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
              <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading RFQs...</p>
              </div>
            ) : filteredRFQs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-1">No RFQs found</p>
                <p className="text-sm text-gray-400">
                  {filter === 'awaiting' && 'All sent RFQs have received responses'}
                  {filter === 'responses' && 'No RFQs have responses yet'}
                  {filter === 'all' && 'Create a restocking RFQ to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRFQs.map((rfq) => {
                  const pendingCount = getPendingCount(rfq);
                  const receivedCount = getReceivedCount(rfq);
                  const totalSuppliers = rfq.responses.length;

                  return (
                    <button
                      key={rfq.id}
                      onClick={() => handleRFQClick(rfq)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* RFQ Number & Status */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {rfq.rfqNumber}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              rfq.status === 'sent'
                                ? pendingCount > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                                : rfq.status === 'responses_received'
                                ? 'bg-green-100 text-green-800'
                                : rfq.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rfq.status === 'sent' && pendingCount > 0 && 'Awaiting Responses'}
                              {rfq.status === 'sent' && pendingCount === 0 && 'All Responses Received'}
                              {rfq.status === 'responses_received' && 'Responses Received'}
                              {rfq.status === 'draft' && 'Draft'}
                              {rfq.status === 'closed' && 'Closed'}
                            </span>
                          </div>

                          {/* Products */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Package className="w-4 h-4" />
                            <span>
                              {rfq.products.length} product{rfq.products.length !== 1 ? 's' : ''}: {' '}
                              {rfq.products.slice(0, 2).map(p => p.name).join(', ')}
                              {rfq.products.length > 2 && ` +${rfq.products.length - 2} more`}
                            </span>
                          </div>

                          {/* Suppliers & Responses */}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>{totalSuppliers} supplier{totalSuppliers !== 1 ? 's' : ''}</span>
                            </div>
                            {receivedCount > 0 && (
                              <div className="flex items-center gap-2 text-green-600">
                                <Mail className="w-4 h-4" />
                                <span>{receivedCount} response{receivedCount !== 1 ? 's' : ''} received</span>
                              </div>
                            )}
                            {pendingCount > 0 && (
                              <div className="flex items-center gap-2 text-yellow-600">
                                <Clock className="w-4 h-4" />
                                <span>{pendingCount} pending</span>
                              </div>
                            )}
                          </div>

                          {/* Sent Date */}
                          {rfq.sentAt && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Sent {getDaysAgo(rfq.sentAt)}</span>
                            </div>
                          )}
                        </div>

                        {/* Arrow Icon */}
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 flex-shrink-0 mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRFQ && (
        <RestockingRFQDetailModal
          isOpen={!!selectedRFQ}
          onClose={handleDetailModalClose}
          rfqId={selectedRFQ.id}
        />
      )}
    </>
  );
}
