import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { ClipboardCheck, CheckCircle, Clock, MapPin } from 'lucide-react';

interface ActiveSession {
  id: string;
  sessionNumber: string;
  locationName: string;
  startedAt: string;
  totalLines: number;
  countedLines: number;
}

interface StockCountStats {
  activeSessionsCount: number;
  activeSessions: ActiveSession[];
}

export function StockCountSessionsNotification() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery<StockCountStats>({
    queryKey: ['stock-count-session-stats'],
    queryFn: async () => {
      const response = await api.get('/inventory/stock-count/sessions/stats');
      return response.data.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  const activeCount = stats?.activeSessionsCount || 0;

  if (activeCount === 0) {
    return (
      <div className="border border-teal-200 bg-teal-50 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-teal-600" />
          <div>
            <h3 className="text-lg font-semibold text-teal-900">No Active Stock Counts</h3>
            <p className="text-sm text-teal-700 mt-1">
              All stock count sessions are complete
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSessionClick = (sessionId: string) => {
    navigate(`/stock-count/${sessionId}`);
  };

  return (
    <div className="border border-teal-300 bg-teal-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6 text-teal-600" />
          <div>
            <h3 className="text-lg font-semibold text-teal-900">
              Active Stock Count Sessions
            </h3>
            <p className="text-sm text-teal-700">
              {activeCount} session{activeCount !== 1 ? 's' : ''} in progress
            </p>
          </div>
        </div>
      </div>

      {/* Active Sessions List */}
      <div className="space-y-3">
        {stats?.activeSessions.map((session) => {
          const progress = session.totalLines > 0
            ? Math.round((session.countedLines / session.totalLines) * 100)
            : 0;

          const startedDate = new Date(session.startedAt);
          const hoursAgo = Math.floor((Date.now() - startedDate.getTime()) / (1000 * 60 * 60));

          return (
            <div
              key={session.id}
              className="border border-teal-300 bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSessionClick(session.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {session.sessionNumber}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{session.locationName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      Started {hoursAgo > 24
                        ? `${Math.floor(hoursAgo / 24)} day${Math.floor(hoursAgo / 24) !== 1 ? 's' : ''} ago`
                        : hoursAgo > 0
                        ? `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`
                        : 'less than an hour ago'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{session.countedLines} / {session.totalLines} items counted</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress === 100
                        ? 'bg-green-600'
                        : progress >= 50
                        ? 'bg-teal-600'
                        : 'bg-yellow-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progress === 100
                    ? '✅ Ready to finalize'
                    : `${progress}% complete`
                  }
                </p>
              </div>

              {/* Action Hint */}
              <p className="text-xs text-teal-700 mt-3">
                Click to {progress === 100 ? 'finalize session' : 'continue counting'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-teal-200">
        <p className="text-sm text-teal-800">
          <strong>Tip:</strong> Complete stock count sessions to ensure accurate inventory records.
        </p>
      </div>
    </div>
  );
}
