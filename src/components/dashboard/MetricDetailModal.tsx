import React from 'react';
import { X, Download } from 'lucide-react';
import type { DateRangeParams } from '../../lib/api/dashboard';

export type MetricType =
  | 'totalRevenue'
  | 'totalTransactions'
  | 'completed'
  | 'conversionRate'
  | 'avgTransactionValue'
  | 'statusBreakdown'
  | 'revenueTrend';

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: MetricType;
  title: string;
  dateParams: DateRangeParams;
  children: React.ReactNode;
  onExport?: () => void;
}

export function MetricDetailModal({
  isOpen,
  onClose,
  title,
  children,
  onExport,
}: MetricDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Export Data"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
