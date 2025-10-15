import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopProducts } from '../../lib/api/dashboard';
import type { DateRangeParams, TopProductData } from '../../lib/api/dashboard';
import { Package, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';

interface TopProductsSectionProps {
  dateParams: DateRangeParams;
}

export function TopProductsSection({ dateParams }: TopProductsSectionProps) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'quantity' | 'margin'>('revenue');

  const { data, isLoading, error } = useQuery({
    queryKey: ['top-products', dateParams],
    queryFn: () => fetchTopProducts(dateParams, 10),
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load top products. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getProductData = (): TopProductData[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'revenue':
        return data.topByRevenue || [];
      case 'quantity':
        return data.topByQuantity || [];
      case 'margin':
        return data.topByMargin || [];
      default:
        return data.topByRevenue || [];
    }
  };

  const productData = getProductData();

  return (
    <div className="space-y-6" data-section="top-products">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-6 py-3 text-base font-medium border-b-2 transition-colors ${
            activeTab === 'revenue'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            By Revenue
          </div>
        </button>
        <button
          onClick={() => setActiveTab('quantity')}
          className={`px-6 py-3 text-base font-medium border-b-2 transition-colors ${
            activeTab === 'quantity'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            By Quantity
          </div>
        </button>
        <button
          onClick={() => setActiveTab('margin')}
          className={`px-6 py-3 text-base font-medium border-b-2 transition-colors ${
            activeTab === 'margin'
              ? 'border-green-600 text-green-600'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : productData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No product data available for this period
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
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty Sold
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
                {productData.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                          ${index === 0 ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${index === 1 ? 'bg-gray-100 text-gray-800' : ''}
                          ${index === 2 ? 'bg-orange-100 text-orange-800' : ''}
                          ${index > 2 ? 'bg-green-50 text-green-800' : ''}
                        `}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{product.productSku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(product.revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{product.quantitySold.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(product.profit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${product.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.profitMargin.toFixed(1)}%
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
