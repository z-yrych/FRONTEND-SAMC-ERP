import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopClients } from '../../lib/api/dashboard';
import type { DateRangeParams, TopClientData } from '../../lib/api/dashboard';
import { Users, TrendingUp, DollarSign } from 'lucide-react';

interface TopClientsSectionProps {
  dateParams: DateRangeParams;
}

export function TopClientsSection({ dateParams }: TopClientsSectionProps) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'volume' | 'margin'>('revenue');

  const { data, isLoading, error } = useQuery({
    queryKey: ['top-clients', dateParams],
    queryFn: () => fetchTopClients(dateParams, 10),
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load top clients. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getClientData = (): TopClientData[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'revenue':
        return data.topByRevenue || [];
      case 'volume':
        return data.topByVolume || [];
      case 'margin':
        return data.topByMargin || [];
      default:
        return data.topByRevenue || [];
    }
  };

  const clientData = getClientData();

  return (
    <div className="space-y-6" data-section="top-clients">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-6 py-3 text-base font-medium border-b-2 transition-colors ${
            activeTab === 'revenue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            By Revenue
          </div>
        </button>
        <button
          onClick={() => setActiveTab('volume')}
          className={`px-6 py-3 text-base font-medium border-b-2 transition-colors ${
            activeTab === 'volume'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            By Volume
          </div>
        </button>
        <button
          onClick={() => setActiveTab('margin')}
          className={`px-6 py-3 text-base font-medium border-b-2 transition-colors ${
            activeTab === 'margin'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            By Margin
          </div>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        ) : clientData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No client data available for this period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientData.map((client, index) => (
                  <tr key={client.clientId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                          ${index === 0 ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${index === 1 ? 'bg-gray-100 text-gray-800' : ''}
                          ${index === 2 ? 'bg-orange-100 text-orange-800' : ''}
                          ${index > 2 ? 'bg-blue-50 text-blue-800' : ''}
                        `}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{client.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(client.revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{client.transactionCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${client.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(client.profit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${client.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {client.profitMargin.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
