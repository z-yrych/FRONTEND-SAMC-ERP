import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSalesMetrics } from '../../lib/api/dashboard';
import type { DateRangeParams } from '../../lib/api/dashboard';
import { KPICard } from './KPICard';
import { DollarSign, FileText, TrendingUp, Target, CheckCircle, ChevronRight } from 'lucide-react';
import { MetricDetailModal } from './MetricDetailModal';
import type { MetricType } from './MetricDetailModal';
import { TotalRevenueModalContent } from './modals/TotalRevenueModal';
import { TotalTransactionsModalContent } from './modals/TotalTransactionsModal';
import { CompletedTransactionsModalContent } from './modals/CompletedTransactionsModal';
import { ConversionRateModalContent } from './modals/ConversionRateModal';
import { AvgTransactionValueModalContent } from './modals/AvgTransactionValueModal';
import { StatusBreakdownModalContent } from './modals/StatusBreakdownModal';
import { RevenueTrendModalContent } from './modals/RevenueTrendModal';

interface SalesMetricsSectionProps {
  dateParams: DateRangeParams;
}

export function SalesMetricsSection({ dateParams }: SalesMetricsSectionProps) {
  const [openModal, setOpenModal] = useState<MetricType | null>(null);
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['sales-metrics', dateParams],
    queryFn: () => fetchSalesMetrics(dateParams),
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load sales metrics. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getModalTitle = (type: MetricType | null): string => {
    if (!type) return '';
    const titles: Record<MetricType, string> = {
      totalRevenue: 'Total Revenue Details',
      totalTransactions: 'Total Transactions Details',
      completed: 'Completed Transactions Details',
      conversionRate: 'Conversion Rate Analysis',
      avgTransactionValue: 'Transaction Value Analysis',
      statusBreakdown: 'Transaction Status Breakdown',
      revenueTrend: 'Revenue Trend Analysis',
    };
    return titles[type];
  };

  const renderModalContent = () => {
    if (!openModal) return null;

    // Render specific modal content based on metric type
    switch (openModal) {
      case 'totalRevenue':
        return <TotalRevenueModalContent dateParams={dateParams} />;

      case 'totalTransactions':
        return <TotalTransactionsModalContent dateParams={dateParams} />;

      case 'completed':
        return <CompletedTransactionsModalContent dateParams={dateParams} />;

      case 'conversionRate':
        return <ConversionRateModalContent dateParams={dateParams} />;

      case 'avgTransactionValue':
        return <AvgTransactionValueModalContent dateParams={dateParams} />;

      case 'statusBreakdown':
        return <StatusBreakdownModalContent dateParams={dateParams} />;

      case 'revenueTrend':
        return <RevenueTrendModalContent dateParams={dateParams} />;

      default:
        // Placeholder for other modals
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-blue-800 text-center">
                Detailed analytics for {getModalTitle(openModal)} will be displayed here.
              </p>
              <p className="text-blue-600 text-center mt-2 text-sm">
                Coming soon: Charts, transaction lists, and detailed breakdowns
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6" data-section="sales">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        <KPICard
          title="Total Revenue"
          value={metrics ? formatCurrency(metrics.totalRevenue) : '₱0.00'}
          icon={DollarSign}
          iconColor="text-green-600"
          borderColor="border-green-200"
          subtitle="From completed transactions"
          loading={isLoading}
          clickable={true}
          onClick={() => setOpenModal('totalRevenue')}
        />

        <KPICard
          title="Total Transactions"
          value={metrics?.totalTransactions ?? 0}
          icon={FileText}
          iconColor="text-blue-600"
          borderColor="border-blue-200"
          subtitle={metrics ? `${metrics.rfqCount} RFQs, ${metrics.poCount} POs` : 'RFQs and POs'}
          loading={isLoading}
          clickable={true}
          onClick={() => setOpenModal('totalTransactions')}
        />

        <KPICard
          title="Completed"
          value={metrics?.completedCount ?? 0}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
          subtitle="Completed & delivered"
          loading={isLoading}
          clickable={true}
          onClick={() => setOpenModal('completed')}
        />

        <KPICard
          title="Conversion Rate"
          value={metrics ? `${metrics.conversionRate.toFixed(1)}%` : '0%'}
          icon={Target}
          iconColor="text-purple-600"
          borderColor="border-purple-200"
          subtitle="RFQ to accepted/completed"
          loading={isLoading}
          clickable={true}
          onClick={() => setOpenModal('conversionRate')}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Avg Transaction Value"
          value={metrics ? formatCurrency(metrics.avgTransactionValue) : '₱0.00'}
          icon={TrendingUp}
          iconColor="text-indigo-600"
          borderColor="border-indigo-200"
          subtitle="Average value per completed transaction"
          loading={isLoading}
          clickable={true}
          onClick={() => setOpenModal('avgTransactionValue')}
        />

        {/* Status Breakdown Card */}
        {!isLoading && metrics && (
          <button
            onClick={() => setOpenModal('statusBreakdown')}
            className="bg-white rounded-lg border-2 border-gray-200 p-7 hover:shadow-lg transition-all cursor-pointer text-left w-full transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Transaction Status Breakdown</h3>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              {metrics.statusBreakdown
                .filter(item => item.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(item => (
                  <div key={item.status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">
                      {item.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
            </div>
          </button>
        )}
      </div>

      {/* Revenue Trend Chart - Simplified table for now */}
      {!isLoading && metrics && metrics.revenueTrend.length > 0 && (
        <button
          onClick={() => setOpenModal('revenueTrend')}
          className="bg-white rounded-lg border-2 border-gray-200 p-7 hover:shadow-lg transition-all cursor-pointer text-left w-full transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Revenue Trend</h3>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-full">
              {metrics.revenueTrend.slice(-7).map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="bg-green-100 rounded p-2">
                    <div className="text-sm font-semibold text-green-800">
                      ₱{item.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </button>
      )}

      {/* Detail Modal */}
      <MetricDetailModal
        isOpen={openModal !== null}
        onClose={() => setOpenModal(null)}
        metricType={openModal || 'totalRevenue'}
        title={getModalTitle(openModal)}
        dateParams={dateParams}
      >
        {renderModalContent()}
      </MetricDetailModal>
    </div>
  );
}
