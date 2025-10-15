import { useQuery } from '@tanstack/react-query';
import { fetchFinancialMetrics } from '../../lib/api/dashboard';
import type { DateRangeParams } from '../../lib/api/dashboard';
import { KPICard } from './KPICard';
import { DollarSign, FileText, AlertCircle, TrendingUp, Clock, CreditCard } from 'lucide-react';

interface FinancialMetricsSectionProps {
  dateParams: DateRangeParams;
}

export function FinancialMetricsSection({ dateParams }: FinancialMetricsSectionProps) {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['financial-metrics', dateParams],
    queryFn: () => fetchFinancialMetrics(dateParams),
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load financial metrics. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6" data-section="financial">
      {/* Top Row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Invoiced"
          value={metrics ? formatCurrency(metrics.totalInvoiced) : '₱0.00'}
          icon={FileText}
          iconColor="text-blue-600"
          borderColor="border-blue-200"
          subtitle={`${metrics?.invoiceCount || 0} invoices`}
          loading={isLoading}
        />

        <KPICard
          title="Total Paid"
          value={metrics ? formatCurrency(metrics.totalPaid) : '₱0.00'}
          icon={CreditCard}
          iconColor="text-green-600"
          borderColor="border-green-200"
          subtitle={metrics ? `${metrics.collectionRate.toFixed(1)}% collection rate` : 'Collection rate'}
          loading={isLoading}
        />

        <KPICard
          title="Outstanding (AR)"
          value={metrics ? formatCurrency(metrics.totalOutstanding) : '₱0.00'}
          icon={DollarSign}
          iconColor="text-orange-600"
          borderColor="border-orange-200"
          subtitle="Total accounts receivable"
          loading={isLoading}
        />

        <KPICard
          title="Overdue"
          value={metrics ? formatCurrency(metrics.totalOverdue) : '₱0.00'}
          icon={AlertCircle}
          iconColor="text-red-600"
          borderColor="border-red-200"
          subtitle={`${metrics?.overdueCount || 0} overdue invoices`}
          loading={isLoading}
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Avg Days to Payment"
          value={metrics ? `${metrics.avgDaysToPayment} days` : '0 days'}
          icon={Clock}
          iconColor="text-purple-600"
          borderColor="border-purple-200"
          subtitle="Average time from invoice to payment"
          loading={isLoading}
        />

        <KPICard
          title="Collection Rate"
          value={metrics ? `${metrics.collectionRate.toFixed(1)}%` : '0%'}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          borderColor="border-emerald-200"
          subtitle="Percentage of invoiced amount collected"
          loading={isLoading}
        />
      </div>

      {/* AR Aging Analysis */}
      {!isLoading && metrics && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-6">
            Accounts Receivable Aging
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-5 border-2 border-green-200">
              <div className="text-sm font-medium text-green-800 mb-2">Current (0-30 days)</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(metrics.arAging.current)}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-5 border-2 border-yellow-200">
              <div className="text-sm font-medium text-yellow-800 mb-2">31-60 days</div>
              <div className="text-2xl font-bold text-yellow-900">
                {formatCurrency(metrics.arAging.days31_60)}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-5 border-2 border-orange-200">
              <div className="text-sm font-medium text-orange-800 mb-2">61-90 days</div>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(metrics.arAging.days61_90)}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-5 border-2 border-red-200">
              <div className="text-sm font-medium text-red-800 mb-2">Over 90 days</div>
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(metrics.arAging.over90)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Status Breakdown */}
      {!isLoading && metrics && metrics.invoiceStatusBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-7">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Invoice Status Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.invoiceStatusBreakdown
                  .filter(item => item.count > 0)
                  .map(item => (
                    <tr key={item.status} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">{item.count}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
