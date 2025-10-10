import { useState } from 'react'
import { TrendingDown, TrendingUp, Package, MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

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

interface AdjustmentCardProps {
  adjustment: Adjustment
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

export function AdjustmentCard({
  adjustment,
  onApprove,
  onReject,
  isSelected,
  onToggleSelect,
}: AdjustmentCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }
    onReject(adjustment.id, rejectionReason)
    setShowRejectDialog(false)
    setRejectionReason('')
  }

  const isShortage = adjustment.adjustmentType === 'shortage'

  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all ${
        isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Checkbox */}
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(adjustment.id)}
            className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />

          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{adjustment.adjustmentNumber}</h3>
              {adjustment.isLocationMismatch && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3" />
                  Location Mismatch
                </span>
              )}
            </div>

            {/* Product and Batch Info */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{adjustment.productName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-500">Batch:</span>
                <span className="font-mono">{adjustment.batch?.batchNumber}</span>
              </div>
              {adjustment.batch?.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{adjustment.batch.location}</span>
                </div>
              )}
            </div>

            {/* Quantity Comparison */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-600 mb-1">Expected</p>
                <p className="text-lg font-semibold text-gray-900">{adjustment.expectedQuantity}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-600 mb-1">Counted</p>
                <p className="text-lg font-semibold text-gray-900">{adjustment.countedQuantity}</p>
              </div>
              <div className={`rounded p-2 ${isShortage ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className="text-xs text-gray-600 mb-1">Discrepancy</p>
                <div className="flex items-center gap-1">
                  {isShortage ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  )}
                  <p className={`text-lg font-semibold ${isShortage ? 'text-red-600' : 'text-green-600'}`}>
                    {adjustment.discrepancy > 0 ? '+' : ''}
                    {adjustment.discrepancy}
                  </p>
                </div>
              </div>
            </div>

            {/* Type Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isShortage
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {isShortage ? '📉 Shortage' : '📈 Overage'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(adjustment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onApprove(adjustment.id)}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
          <button
            onClick={() => setShowRejectDialog(true)}
            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Adjustment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting adjustment {adjustment.adjustmentNumber}
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectionReason('')
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
