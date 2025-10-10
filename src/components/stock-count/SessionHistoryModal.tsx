import { useState, useEffect } from 'react'
import { X, Loader2, MapPin, Calendar, CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'

interface SessionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StockCountSession {
  id: string
  sessionNumber: string
  locationName: string
  status: 'in_progress' | 'completed' | 'cancelled'
  startedBy: string
  startedAt: string
  completedAt: string | null
  lines: any[]
}

export function SessionHistoryModal({ isOpen, onClose }: SessionHistoryModalProps) {
  const [sessions, setSessions] = useState<StockCountSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'cancelled'>('all')
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      fetchSessions()
    }
  }, [isOpen])

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/inventory/stock-count/sessions/history')
      const data = response.data

      // Handle both array and {data: []} response formats
      const sessionsData = Array.isArray(data) ? data : (data.data || [])
      setSessions(sessionsData)
    } catch (error) {
      console.error('Failed to fetch session history:', error)
      alert('Failed to load session history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResume = (sessionId: string) => {
    navigate(`/stock-count/${sessionId}`)
    onClose()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        )
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        )
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCountSummary = (lines: any[]) => {
    if (!lines || lines.length === 0) return '0 items'

    const counted = lines.filter(l => l.status === 'counted').length
    const total = lines.length
    return `${counted}/${total} counted`
  }

  const getDiscrepancies = (lines: any[]) => {
    if (!lines || lines.length === 0) return 0
    return lines.filter(l => l.status === 'counted' && l.discrepancy !== 0).length
  }

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    return session.status === filter
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Session History</h2>
            <p className="text-sm text-gray-600 mt-1">View and resume stock count sessions</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              In Progress ({sessions.filter(s => s.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Completed ({sessions.filter(s => s.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancelled ({sessions.filter(s => s.status === 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No sessions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.sessionNumber}
                        </h3>
                        {getStatusBadge(session.status)}
                      </div>

                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{session.locationName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(session.startedAt)}</span>
                        </div>

                        <div className="text-gray-600">
                          <span className="font-medium">Items:</span> {getCountSummary(session.lines)}
                        </div>

                        <div className="text-gray-600">
                          <span className="font-medium">Discrepancies:</span>{' '}
                          {getDiscrepancies(session.lines)}
                        </div>
                      </div>

                      {session.completedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Completed: {formatDate(session.completedAt)}
                        </p>
                      )}
                    </div>

                    <div className="ml-4">
                      {session.status === 'in_progress' && (
                        <button
                          onClick={() => handleResume(session.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Resume
                        </button>
                      )}
                      {session.status === 'completed' && (
                        <button
                          onClick={() => handleResume(session.id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
