import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Navigation } from 'lucide-react';

interface AdjustmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: {
    overage: number;
    shortage: number;
    locationCorrection: number;
  };
}

export function InventoryVarianceNotification() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery<AdjustmentStats>({
    queryKey: ['inventory-adjustment-stats'],
    queryFn: async () => {
      const response = await api.get('/inventory/adjustments/stats');
      return response.data.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  const pendingCount = stats?.pending || 0;

  if (pendingCount === 0) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
          <div>
            <h3 className="text-lg font-semibold text-emerald-900">No Pending Adjustments</h3>
            <p className="text-sm text-emerald-700 mt-1">
              All inventory adjustments have been processed
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleViewAdjustments = () => {
    // Navigate to adjustments page - update path as needed
    navigate('/inventory/adjustments');
  };

  return (
    <div className="border border-rose-300 bg-rose-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <div>
            <h3 className="text-lg font-semibold text-rose-900">
              Inventory Variance Detected
            </h3>
            <p className="text-sm text-rose-700">
              {pendingCount} adjustment{pendingCount !== 1 ? 's' : ''} pending approval
            </p>
          </div>
        </div>
      </div>

      {/* Variance Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Overages */}
        {stats && stats.byType.overage > 0 && (
          <div className="bg-white border border-green-300 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Overages</span>
            </div>
            <p className="text-lg font-bold text-green-700">{stats.byType.overage}</p>
            <p className="text-xs text-gray-500">More than expected</p>
          </div>
        )}

        {/* Shortages */}
        {stats && stats.byType.shortage > 0 && (
          <div className="bg-white border border-red-300 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-gray-600">Shortages</span>
            </div>
            <p className="text-lg font-bold text-red-700">{stats.byType.shortage}</p>
            <p className="text-xs text-gray-500">Less than expected</p>
          </div>
        )}

        {/* Location Mismatches */}
        {stats && stats.byType.locationCorrection > 0 && (
          <div className="bg-white border border-blue-300 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Mismatches</span>
            </div>
            <p className="text-lg font-bold text-blue-700">{stats.byType.locationCorrection}</p>
            <p className="text-xs text-gray-500">Wrong location</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleViewAdjustments}
        className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
      >
        Review & Approve Adjustments
      </button>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-rose-200">
        <p className="text-sm text-rose-800">
          <strong>Tip:</strong> Review and approve adjustments to update inventory records accurately.
        </p>
      </div>
    </div>
  );
}
