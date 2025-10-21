import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSalesMetrics } from '../../../lib/api/dashboard';
import type { DateRangeParams } from '../../../lib/api/dashboard';
import { TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3 } from 'lucide-react';

interface RevenueTrendModalProps {
  dateParams: DateRangeParams;
}

export function RevenueTrendModalContent({ dateParams }: RevenueTrendModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenue-trend-details', dateParams],
    queryFn: () => fetchSalesMetrics(dateParams),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load revenue trend data. Please try again.</p>
      </div>
    );
  }

  if (!data || !data.revenueTrend || data.revenueTrend.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-800">No revenue trend data available for the selected period.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const revenueTrend = data.revenueTrend;

  // Calculate statistics
  const totalRevenue = revenueTrend.reduce((sum, day) => sum + day.revenue, 0);
  const avgDailyRevenue = totalRevenue / revenueTrend.length;
  const maxRevenue = Math.max(...revenueTrend.map(day => day.revenue));
  const minRevenue = Math.min(...revenueTrend.map(day => day.revenue));
  const maxDay = revenueTrend.find(day => day.revenue === maxRevenue);
  const minDay = revenueTrend.find(day => day.revenue === minRevenue);

  // Calculate trend direction
  const recentDays = revenueTrend.slice(-7);
  const olderDays = revenueTrend.slice(0, Math.min(7, revenueTrend.length - 7));
  const recentAvg = recentDays.reduce((sum, day) => sum + day.revenue, 0) / recentDays.length;
  const olderAvg = olderDays.length > 0
    ? olderDays.reduce((sum, day) => sum + day.revenue, 0) / olderDays.length
    : recentAvg;
  const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  const isUpward = trendPercentage > 0;

  // Find the maximum value for scaling the chart
  const chartMaxValue = maxRevenue * 1.1; // Add 10% padding

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h3 className="text-sm font-medium text-green-900">Total Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-green-600 mt-1">{revenueTrend.length} days</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-900">Avg Daily Revenue</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{formatCurrency(avgDailyRevenue)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="text-sm font-medium text-purple-900">Highest Day</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{formatCurrency(maxRevenue)}</p>
          {maxDay && (
            <p className="text-sm text-purple-600 mt-1">
              {new Date(maxDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>

        <div className={`bg-gradient-to-br ${
          isUpward ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-orange-50 to-orange-100 border-orange-200'
        } border-2 rounded-lg p-6`}>
          <div className="flex items-center gap-3 mb-2">
            {isUpward ? (
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-orange-600" />
            )}
            <h3 className={`text-sm font-medium ${isUpward ? 'text-emerald-900' : 'text-orange-900'}`}>
              Trend
            </h3>
          </div>
          <p className={`text-3xl font-bold ${isUpward ? 'text-emerald-700' : 'text-orange-700'}`}>
            {isUpward ? '+' : ''}{trendPercentage.toFixed(1)}%
          </p>
          <p className={`text-sm ${isUpward ? 'text-emerald-600' : 'text-orange-600'} mt-1`}>
            Last 7 days vs previous
          </p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Revenue Trend</h3>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-1 h-64 border-b-2 border-gray-200 pb-2">
            {revenueTrend.map((day, index) => {
              const barHeight = chartMaxValue > 0 ? (day.revenue / chartMaxValue) * 100 : 0;
              const isMaxDay = day.revenue === maxRevenue;
              const isMinDay = day.revenue === minRevenue && minRevenue !== maxRevenue;
              const isRecent = index >= revenueTrend.length - 7;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isMaxDay ? 'bg-green-600' :
                        isMinDay ? 'bg-red-600' :
                        isRecent ? 'bg-blue-600' :
                        'bg-gray-400'
                      } group-hover:opacity-80 cursor-pointer`}
                      style={{ height: `${barHeight}%`, minHeight: barHeight > 0 ? '2px' : '0' }}
                      title={`${new Date(day.date).toLocaleDateString()}: ${formatCurrency(day.revenue)}`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Date Labels - Show every few days to avoid crowding */}
          <div className="flex justify-between text-xs text-gray-600">
            {revenueTrend.length <= 31 ? (
              // Show all dates if 31 or fewer
              revenueTrend.map((day, index) => (
                index % Math.ceil(revenueTrend.length / 7) === 0 && (
                  <span key={day.date} className="text-center">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )
              ))
            ) : (
              // Show weekly intervals for longer periods
              <>
                <span>{new Date(revenueTrend[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(revenueTrend[Math.floor(revenueTrend.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span>{new Date(revenueTrend[revenueTrend.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Recent (Last 7 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>Earlier Days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span>Highest Day</span>
            </div>
            {minRevenue !== maxRevenue && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Lowest Day</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Daily Breakdown */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day of Week
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  vs Avg
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...revenueTrend].reverse().map((day) => {
                const vsAvg = avgDailyRevenue > 0 ? ((day.revenue - avgDailyRevenue) / avgDailyRevenue) * 100 : 0;
                const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';

                return (
                  <tr key={day.date} className={`hover:bg-gray-50 ${isWeekend ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {dayOfWeek}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <span className={vsAvg >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        {day.revenue >= avgDailyRevenue * 1.5 ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Excellent
                          </span>
                        ) : day.revenue >= avgDailyRevenue ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Above Avg
                          </span>
                        ) : day.revenue >= avgDailyRevenue * 0.5 ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Below Avg
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Revenue Trend Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-600 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-green-900">Trend Direction</p>
              <p className="text-sm text-green-700">
                Revenue is trending {isUpward ? 'upward' : 'downward'} with a {Math.abs(trendPercentage).toFixed(1)}%
                {isUpward ? ' increase' : ' decrease'} in the last 7 days compared to the previous period.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-green-900">Daily Performance</p>
              <p className="text-sm text-green-700">
                Average daily revenue is {formatCurrency(avgDailyRevenue)}.
                {maxDay && minDay && ` The highest day (${new Date(maxDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                generated ${((maxRevenue / minRevenue - 1) * 100).toFixed(0)}% more revenue than the lowest day.`}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-green-900">Consistency</p>
              <p className="text-sm text-green-700">
                The revenue range spans from {formatCurrency(minRevenue)} to {formatCurrency(maxRevenue)},
                showing {maxRevenue / avgDailyRevenue > 2 ? 'high' : maxRevenue / avgDailyRevenue > 1.5 ? 'moderate' : 'low'} variability
                in daily revenue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
