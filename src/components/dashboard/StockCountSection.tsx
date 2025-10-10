import { useState, useEffect } from 'react'
import { ClipboardCheck, FileCheck, TrendingUp, Eye, CheckCircle } from 'lucide-react'
import { ActionCard } from './ActionCard'
import { StartStockCountModal } from '../inventory/StartStockCountModal'
import { SessionHistoryModal } from '../stock-count/SessionHistoryModal'
import { AdjustmentApprovalModal } from '../stock-count/AdjustmentApprovalModal'
import api from '../../lib/axios'

interface StockCountStats {
  activeSessions: number
  pendingAdjustments: number
  thisWeekCounts: number
}

export function StockCountSection() {
  const [stats, setStats] = useState<StockCountStats>({
    activeSessions: 0,
    pendingAdjustments: 0,
    thisWeekCounts: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isAdjustmentsModalOpen, setIsAdjustmentsModalOpen] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // Fetch active sessions count
      const sessionsRes = await api.get('/inventory/stock-count/sessions/history')
      const sessionsData = sessionsRes.data
      const activeSessions = Array.isArray(sessionsData)
        ? sessionsData.filter((s: any) => s.status === 'in_progress').length
        : sessionsData.data?.filter((s: any) => s.status === 'in_progress').length || 0

      // Fetch pending adjustments count
      const adjustmentsRes = await api.get('/inventory/adjustments/pending')
      const adjustmentsData = adjustmentsRes.data
      const pendingAdjustments = Array.isArray(adjustmentsData)
        ? adjustmentsData.length
        : adjustmentsData.data?.length || 0

      // Calculate this week's counts
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const thisWeekCounts = Array.isArray(sessionsData)
        ? sessionsData.filter((s: any) => {
            const completedAt = s.completedAt ? new Date(s.completedAt) : null
            return completedAt && completedAt >= oneWeekAgo
          }).length
        : 0

      setStats({
        activeSessions,
        pendingAdjustments,
        thisWeekCounts,
      })
    } catch (error) {
      console.error('Failed to fetch stock count stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePerformStockCount = () => {
    setIsStartModalOpen(true)
  }

  const handleViewHistory = () => {
    setIsHistoryModalOpen(true)
  }

  const handleReviewAdjustments = () => {
    setIsAdjustmentsModalOpen(true)
  }

  return (
    <div className="space-y-6" data-section="stock-count">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Stock Count Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Perform physical inventory counts and review discrepancies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Sessions */}
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {isLoading ? '...' : stats.activeSessions}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Counting in progress</p>
        </div>

        {/* Pending Adjustments */}
        <div className="bg-white rounded-lg border-2 border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Adjustments</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {isLoading ? '...' : stats.pendingAdjustments}
              </p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <FileCheck className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Awaiting approval</p>
        </div>

        {/* This Week's Counts */}
        <div className="bg-white rounded-lg border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {isLoading ? '...' : stats.thisWeekCounts}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Completed counts</p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon={ClipboardCheck}
          title="Perform Stock Count"
          description="Start a new physical inventory count session"
          onClick={handlePerformStockCount}
        />

        <ActionCard
          icon={Eye}
          title="View Session History"
          description="Review past counts and resume in-progress sessions"
          onClick={handleViewHistory}
        />

        <ActionCard
          icon={CheckCircle}
          title="Review Adjustments"
          description="Approve or reject inventory discrepancies"
          onClick={handleReviewAdjustments}
        />
      </div>

      {/* Modals */}
      <StartStockCountModal
        isOpen={isStartModalOpen}
        onClose={() => {
          setIsStartModalOpen(false)
          fetchStats() // Refresh stats when modal closes
        }}
      />

      {/* Session History Modal */}
      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false)
          fetchStats() // Refresh stats when modal closes
        }}
      />

      {/* Adjustments Modal */}
      <AdjustmentApprovalModal
        isOpen={isAdjustmentsModalOpen}
        onClose={() => {
          setIsAdjustmentsModalOpen(false)
          fetchStats() // Refresh stats when modal closes
        }}
      />
    </div>
  )
}
