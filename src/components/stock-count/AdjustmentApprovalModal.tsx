import { useState, useEffect } from 'react'
import { X, Loader2, TrendingDown, TrendingUp, CheckCircle } from 'lucide-react'
import { AdjustmentCard } from './AdjustmentCard'
import api from '../../lib/axios'

interface AdjustmentApprovalModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Adjustment {
  id: string
  adjustmentNumber: string
  sessionId: string
  productName: string
  batchId: string
  expectedQuantity: number
  countedQuantity: number
  discrepancy: number
  adjustmentType: 'shortage' | 'overage'
  status: 'pending' | 'approved' | 'rejected'
  isLocationMismatch: boolean
  createdAt: string
  batch?: {
    batchNumber: string
    location: string
  }
}

export function AdjustmentApprovalModal({ isOpen, onClose }: AdjustmentApprovalModalProps) {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchAdjustments()
    }
  }, [isOpen])

  const fetchAdjustments = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/inventory/adjustments/pending')
      const data = response.data

      // Handle both array and {data: []} response formats
      const adjustmentsData = Array.isArray(data) ? data : (data.data || [])
      setAdjustments(adjustmentsData)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Failed to fetch adjustments:', error)
      alert('Failed to load pending adjustments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (adjustmentId: string) => {
    try {
      const response = await api.post(`/inventory/adjustments/${adjustmentId}/approve`, {
        approvedBy: 'current-user', // TODO: Get from auth
      })

      alert(response.data.message || 'Adjustment approved successfully')

      // Refresh list
      await fetchAdjustments()
    } catch (error) {
      console.error('Failed to approve adjustment:', error)
      alert('Failed to approve adjustment. Please try again.')
    }
  }

  const handleReject = async (adjustmentId: string, reason: string) => {
    try {
      const response = await api.post(`/inventory/adjustments/${adjustmentId}/reject`, {
        rejectedBy: 'current-user', // TODO: Get from auth
        rejectionReason: reason,
      })

      alert(response.data.message || 'Adjustment rejected successfully')

      // Refresh list
      await fetchAdjustments()
    } catch (error) {
      console.error('Failed to reject adjustment:', error)
      alert('Failed to reject adjustment. Please try again.')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one adjustment to approve')
      return
    }

    if (!confirm(`Approve ${selectedIds.size} adjustment(s)?`)) {
      return
    }

    try {
      const response = await api.post('/inventory/adjustments/bulk-approve', {
        adjustmentIds: Array.from(selectedIds),
        approvedBy: 'current-user', // TODO: Get from auth
      })

      alert(response.data.message || 'Adjustments approved successfully')

      // Refresh list
      await fetchAdjustments()
    } catch (error) {
      console.error('Failed to bulk approve:', error)
      alert('Failed to bulk approve adjustments. Please try again.')
    }
  }

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === adjustments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(adjustments.map(a => a.id)))
    }
  }

  const shortageCount = adjustments.filter(a => a.adjustmentType === 'shortage').length
  const overageCount = adjustments.filter(a => a.adjustmentType === 'overage').length
  const totalShortageValue = adjustments
    .filter(a => a.adjustmentType === 'shortage')
    .reduce((sum, a) => sum + Math.abs(a.discrepancy), 0)
  const totalOverageValue = adjustments
    .filter(a => a.adjustmentType === 'overage')
    .reduce((sum, a) => sum + a.discrepancy, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Pending Adjustments</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve inventory discrepancies
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">{adjustments.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-600" />
                <p className="text-xs text-gray-600">Shortages</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{shortageCount}</p>
              <p className="text-xs text-gray-500 mt-1">{totalShortageValue} units</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <p className="text-xs text-gray-600">Overages</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{overageCount}</p>
              <p className="text-xs text-gray-500 mt-1">{totalOverageValue} units</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-gray-600 mb-1">Selected</p>
              <p className="text-2xl font-bold text-indigo-600">{selectedIds.size}</p>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {adjustments.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.size === adjustments.length && adjustments.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Select All ({adjustments.length})
              </span>
            </label>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Selected ({selectedIds.size})
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : adjustments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-gray-600">No pending adjustments</p>
              <p className="text-sm text-gray-500 mt-1">All discrepancies have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adjustments.map((adjustment) => (
                <AdjustmentCard
                  key={adjustment.id}
                  adjustment={adjustment}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isSelected={selectedIds.has(adjustment.id)}
                  onToggleSelect={handleToggleSelect}
                />
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
