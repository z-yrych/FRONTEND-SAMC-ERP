import { useQuery } from '@tanstack/react-query';
import { fetchSalesMetrics } from '../../lib/api/dashboard';
import type { DateRangeParams } from '../../lib/api/dashboard';
import { KPICard } from './KPICard';
import { DollarSign, FileText, TrendingUp, Target, CheckCircle } from 'lucide-react';

interface SalesMetricsSectionProps {
  dateParams: DateRangeParams;
}

export function SalesMetricsSection({ dateParams }: SalesMetricsSectionProps) {
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
        />

        <KPICard
          title="Total Transactions"
          value={metrics?.totalTransactions ?? 0}
          icon={FileText}
          iconColor="text-blue-600"
          borderColor="border-blue-200"
          subtitle={metrics ? `${metrics.rfqCount} RFQs, ${metrics.poCount} POs` : 'RFQs and POs'}
          loading={isLoading}
        />

        <KPICard
          title="Completed"
          value={metrics?.completedCount ?? 0}
          icon={CheckCircle}
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
          subtitle="Completed & delivered"
          loading={isLoading}
        />

        <KPICard
          title="Conversion Rate"
          value={metrics ? `${metrics.conversionRate.toFixed(1)}%` : '0%'}
          icon={Target}
          iconColor="text-purple-600"
          borderColor="border-purple-200"
          subtitle="RFQ to accepted/completed"
          loading={isLoading}
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
        />

        {/* Status Breakdown Card */}
        {!isLoading && metrics && (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-7">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Transaction Status Breakdown</h3>
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
          </div>
        )}
      </div>

      {/* Revenue Trend Chart - Simplified table for now */}
      {!isLoading && metrics && metrics.revenueTrend.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue Trend</h3>
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
        </div>
      )}
    </div>
  );
}
