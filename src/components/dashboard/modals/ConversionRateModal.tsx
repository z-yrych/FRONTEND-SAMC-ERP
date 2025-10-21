import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchConversionFunnel } from '../../../lib/api/dashboard';
import type { DateRangeParams } from '../../../lib/api/dashboard';
import { Target, TrendingDown, ChevronRight, Users, FileCheck } from 'lucide-react';

interface ConversionRateModalProps {
  dateParams: DateRangeParams;
}

export function ConversionRateModalContent({ dateParams }: ConversionRateModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversion-funnel', dateParams],
    queryFn: () => fetchConversionFunnel(dateParams),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load conversion funnel data. Please try again.</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate conversion rates between stages
  const stages = [
    { label: 'Total RFQs', count: data.totalRfqs, percentage: 100 },
    { label: 'Sourcing', count: data.sourcingCount, percentage: data.totalRfqs > 0 ? (data.sourcingCount / data.totalRfqs) * 100 : 0 },
    { label: 'Quoted', count: data.quotedCount, percentage: data.totalRfqs > 0 ? (data.quotedCount / data.totalRfqs) * 100 : 0 },
    { label: 'Accepted', count: data.acceptedCount, percentage: data.totalRfqs > 0 ? (data.acceptedCount / data.totalRfqs) * 100 : 0 },
    { label: 'Completed', count: data.completedCount, percentage: data.totalRfqs > 0 ? (data.completedCount / data.totalRfqs) * 100 : 0 },
  ];

  // Calculate drop-offs between consecutive stages
  const dropOffs = [];
  for (let i = 0; i < stages.length - 1; i++) {
    const current = stages[i];
    const next = stages[i + 1];
    const dropOffCount = current.count - next.count;
    const dropOffPercentage = current.count > 0 ? (dropOffCount / current.count) * 100 : 0;
    dropOffs.push({
      fromStage: current.label,
      toStage: next.label,
      dropOffCount,
      dropOffPercentage,
    });
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-purple-600" />
            <h3 className="text-sm font-medium text-purple-900">Overall Conversion</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{data.conversionRate.toFixed(1)}%</p>
          <p className="text-sm text-purple-600 mt-1">RFQ to Accepted/Completed</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-green-900">Completion Rate</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{data.completionRate.toFixed(1)}%</p>
          <p className="text-sm text-green-600 mt-1">{data.completedCount} of {data.totalRfqs} RFQs</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            <h3 className="text-sm font-medium text-red-900">Cancellation Rate</h3>
          </div>
          <p className="text-3xl font-bold text-red-700">{data.cancellationRate.toFixed(1)}%</p>
          <p className="text-sm text-red-600 mt-1">{data.cancelledCount} cancelled</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Active RFQs</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{data.activeCount}</p>
          <p className="text-sm text-blue-600 mt-1">In progress</p>
        </div>
      </div>

      {/* Conversion Funnel Visualization */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">RFQ Conversion Funnel</h3>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label}>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-32">
                  <p className="text-sm font-medium text-gray-700">{stage.label}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                      <div
                        className={`h-8 rounded-full flex items-center justify-end pr-3 transition-all ${
                          index === 0 ? 'bg-purple-600' :
                          index === 1 ? 'bg-blue-600' :
                          index === 2 ? 'bg-indigo-600' :
                          index === 3 ? 'bg-green-600' :
                          'bg-emerald-600'
                        }`}
                        style={{ width: `${stage.percentage}%` }}
                      >
                        {stage.percentage >= 15 && (
                          <span className="text-white text-sm font-semibold">
                            {stage.percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-24 text-right">
                      <p className="text-lg font-bold text-gray-900">{stage.count}</p>
                    </div>
                  </div>
                </div>
              </div>
              {index < stages.length - 1 && dropOffs[index] && (
                <div className="ml-32 mt-2 flex items-center gap-2 text-sm text-red-600">
                  <ChevronRight className="w-4 h-4" />
                  <span>
                    Drop-off: {dropOffs[index].dropOffCount} ({dropOffs[index].dropOffPercentage.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stage-by-Stage Breakdown */}
      {data.stageBreakdown && data.stageBreakdown.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.stageBreakdown.map((stage: any) => (
              <div key={stage.stage} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 capitalize">
                    {stage.stage.replace(/_/g, ' ')}
                  </h4>
                  <span className="text-lg font-bold text-gray-900">{stage.count}</span>
                </div>
                {stage.totalValue > 0 && (
                  <p className="text-sm text-gray-600">
                    Total Value: {formatCurrency(stage.totalValue)}
                  </p>
                )}
                {stage.avgValue > 0 && (
                  <p className="text-sm text-gray-600">
                    Avg Value: {formatCurrency(stage.avgValue)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversion Insights */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Conversion Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-purple-900">Quote-to-Accept Rate</p>
              <p className="text-sm text-purple-700">
                {data.quotedCount > 0 ? ((data.acceptedCount / data.quotedCount) * 100).toFixed(1) : 0}%
                of quoted RFQs are accepted ({data.acceptedCount} of {data.quotedCount})
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-purple-900">Accept-to-Complete Rate</p>
              <p className="text-sm text-purple-700">
                {data.acceptedCount > 0 ? ((data.completedCount / data.acceptedCount) * 100).toFixed(1) : 0}%
                of accepted RFQs are completed ({data.completedCount} of {data.acceptedCount})
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-purple-900">Sourcing Success Rate</p>
              <p className="text-sm text-purple-700">
                {data.sourcingCount > 0 ? ((data.quotedCount / data.sourcingCount) * 100).toFixed(1) : 0}%
                of sourcing RFQs receive quotes ({data.quotedCount} of {data.sourcingCount})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancelled RFQs */}
      {data.cancelledRfqs && data.cancelledRfqs.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cancelled RFQs ({data.cancelledRfqs.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RFQ #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Stage
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Potential Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.cancelledRfqs.map((rfq: any) => (
                  <tr key={rfq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                      {rfq.transactionNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {rfq.clientName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      <span className="capitalize">{rfq.lastStage?.replace(/_/g, ' ') || 'Draft'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                      {rfq.totalAmount > 0 ? formatCurrency(rfq.totalAmount) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {new Date(rfq.updatedAt).toLocaleDateString()}
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
