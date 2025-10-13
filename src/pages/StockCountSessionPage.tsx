import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Scan,
  Camera,
  List,
} from 'lucide-react'
import { BarcodeScanner } from '../components/barcode/BarcodeScanner'
import { useKeyboardAwareViewport } from '../hooks/useKeyboardAwareViewport'
import api from '../lib/axios'

interface StockCountSession {
  id: string
  sessionNumber: string
  locationName: string
  status: string
  startedBy: string
  startedAt: string
  lines: CountLine[]
}

interface CountLine {
  id: string
  batchId: string
  productName: string
  expectedQuantity: number
  countedQuantity: number | null
  status: 'pending' | 'counted' | 'not_found' | 'skipped'
  discrepancy: number
  isLocationMismatch: boolean
  batch: {
    batchNumber: string
    location: string
    packagingStructure?: {
      id: string
      name: string
      levels: {
        cases?: { unitsPerCase: number }
        boxes?: { boxesPerCase?: number; unitsPerBox: number }
        pieces?: { name: string }
      }
    }
    packagingBreakdown?: {
      cases?: number
      boxes?: number
      pieces?: number
    }
  }
  product: {
    sku: string
  }
}

type ScanMode = 'manual' | 'camera'

export function StockCountSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<StockCountSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLine, setSelectedLine] = useState<CountLine | null>(null)
  const [scannedBatch, setScannedBatch] = useState('')
  const [scanMode, setScanMode] = useState<ScanMode>('manual')
  const { isVisible: isKeyboardVisible } = useKeyboardAwareViewport()
  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  const fetchSession = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/inventory/stock-count/sessions/${sessionId}`)
      setSession(response.data.data)
    } catch (error) {
      console.error('Failed to fetch session:', error)
      alert('Failed to load stock count session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanBatch = async (batchNumber: string) => {
    if (!session) {
      console.log('No session loaded')
      return
    }

    console.log('Scanning for batch:', batchNumber)
    console.log('Available batches:', session.lines.map(l => l.batch?.batchNumber))

    try {
      // Find batch by batch number
      const line = session.lines.find(l => l.batch?.batchNumber === batchNumber)

      if (line) {
        console.log('Batch found:', line)
        setSelectedLine(line)
        setScannedBatch('')
      } else {
        console.log('Batch not found')
        alert(`Batch ${batchNumber} not found in this location. Check if it belongs to a different warehouse.`)
      }
    } catch (error) {
      console.error('Failed to scan batch:', error)
    }
  }

  const handleRecordCount = async (lineId: string, countedQty: number) => {
    try {
      await api.patch('/inventory/stock-count/lines/record', {
        lineId,
        countedQuantity: countedQty,
        countedBy: 'current-user', // TODO: Get from auth
      })

      // Refresh session
      await fetchSession()
      setSelectedLine(null)
    } catch (error) {
      console.error('Failed to record count:', error)
      alert('Failed to record count. Please try again.')
    }
  }

  const handleMarkNotFound = async (lineId: string) => {
    try {
      await api.patch(`/inventory/stock-count/lines/${lineId}/not-found`, {
        countedBy: 'current-user', // TODO: Get from auth
      })

      // Refresh session
      await fetchSession()
      setSelectedLine(null)
    } catch (error) {
      console.error('Failed to mark as not found:', error)
      alert('Failed to mark batch as not found. Please try again.')
    }
  }

  const handleSkipBatch = async (lineId: string) => {
    try {
      await api.patch(`/inventory/stock-count/lines/${lineId}/skip`)

      // Refresh session
      await fetchSession()
      setSelectedLine(null)
    } catch (error) {
      console.error('Failed to skip batch:', error)
      alert('Failed to skip batch. Please try again.')
    }
  }

  const handleCancelSession = async () => {
    if (!session) return

    const reason = prompt('Please provide a reason for cancelling this session:')
    if (!reason) return // User cancelled

    try {
      await api.post(`/inventory/stock-count/sessions/${sessionId}/cancel`, {
        cancelledBy: 'current-user', // TODO: Get from auth
      })

      alert('Stock count session cancelled.')
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to cancel session:', error)
      alert('Failed to cancel session. Please try again.')
    }
  }

  const handleFinalizeSession = async () => {
    if (!session) return

    const pendingCount = session.lines.filter(l => l.status === 'pending').length
    if (pendingCount > 0) {
      alert(`Cannot finalize: ${pendingCount} items are still pending. Please count all items or mark them as not found.`)
      return
    }

    if (!confirm('Finalize this stock count session? This will create adjustment records for approval.')) {
      return
    }

    try {
      await api.post(`/inventory/stock-count/sessions/${sessionId}/finalize`)

      alert('Stock count session finalized! Adjustments have been created for approval.')
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to finalize session:', error)
      alert('Failed to finalize session. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Session not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const summary = {
    total: session.lines.length,
    counted: session.lines.filter(l => l.status === 'counted').length,
    pending: session.lines.filter(l => l.status === 'pending').length,
    notFound: session.lines.filter(l => l.status === 'not_found').length,
  }

  const progressPercent = (summary.counted / summary.total) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {session.sessionNumber}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{session.locationName}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancelSession}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel Session
              </button>
              <button
                onClick={handleFinalizeSession}
                disabled={summary.pending > 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finalize Session
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
              <span>Progress: {summary.counted} / {summary.total} batches</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Scan Mode Toggle */}
          <div className="mt-4 flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setScanMode('manual')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-all ${
                scanMode === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="font-medium text-sm sm:text-base">Manual Selection</span>
            </button>
            <button
              onClick={() => setScanMode('camera')}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md transition-all ${
                scanMode === 'camera'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="font-medium text-sm sm:text-base">Camera Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batch List or Camera Scanner */}
          <div className="lg:col-span-2 space-y-4">
            {scanMode === 'manual' ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Batches to Count</h2>

                {/* Scan Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Batch Barcode
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={scanInputRef}
                        type="text"
                        value={scannedBatch}
                        onChange={(e) => setScannedBatch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && scannedBatch.trim()) {
                            handleScanBatch(scannedBatch.trim())
                          }
                        }}
                        onFocus={() => {
                          // Scroll into view when keyboard appears
                          if (isKeyboardVisible) {
                            setTimeout(() => {
                              scanInputRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                              })
                            }, 100)
                          }
                        }}
                        placeholder="Scan or enter batch number..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => scannedBatch.trim() && handleScanBatch(scannedBatch.trim())}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Scan
                    </button>
                  </div>
                </div>

                {/* Batch List */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {session.lines.map((line) => (
                    <div
                      key={line.id}
                      onClick={() => setSelectedLine(line)}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${selectedLine?.id === line.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}
                        ${line.isLocationMismatch ? 'bg-yellow-50' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {line.batch.batchNumber}
                            </span>
                            {line.status === 'counted' && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            {line.status === 'not_found' && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            {line.isLocationMismatch && (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{line.productName}</p>
                          <p className="text-xs text-gray-500">Expected: {line.expectedQuantity} units</p>
                          {line.status === 'counted' && (
                            <p className={`text-xs mt-1 ${line.discrepancy === 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Counted: {line.countedQuantity} units
                              {line.discrepancy !== 0 && ` (${line.discrepancy > 0 ? '+' : ''}${line.discrepancy})`}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full
                            ${line.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                            ${line.status === 'counted' ? 'bg-green-100 text-green-800' : ''}
                            ${line.status === 'not_found' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {line.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Camera Scan Mode</h2>

                {/* Scan Progress */}
                <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-green-50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{summary.counted}</p>
                    <p className="text-xs text-green-600 uppercase mt-1">Scanned</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-gray-600">{summary.pending}</p>
                    <p className="text-xs text-gray-600 uppercase mt-1">Remaining</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 sm:p-3 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{summary.notFound}</p>
                    <p className="text-xs text-red-600 uppercase mt-1">Not Found</p>
                  </div>
                </div>

                {/* Camera Scanner */}
                <BarcodeScanner onScan={handleScanBatch} />
              </div>
            )}
          </div>

          {/* Count Entry Panel */}
          <div className="lg:col-span-1">
            {selectedLine ? (
              <CountEntryPanel
                line={selectedLine}
                onRecordCount={handleRecordCount}
                onMarkNotFound={handleMarkNotFound}
                onSkip={handleSkipBatch}
                onClose={() => setSelectedLine(null)}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Select a batch to begin counting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Count Entry Panel Component
interface CountEntryPanelProps {
  line: CountLine
  onRecordCount: (lineId: string, quantity: number) => void
  onMarkNotFound: (lineId: string) => void
  onSkip: (lineId: string) => void
  onClose: () => void
}

function CountEntryPanel({ line, onRecordCount, onMarkNotFound, onSkip, onClose }: CountEntryPanelProps) {
  const [countedQty, setCountedQty] = useState('')
  const [useHierarchical, setUseHierarchical] = useState(false)
  const [casesCount, setCasesCount] = useState('')
  const [boxesCount, setBoxesCount] = useState('')
  const [piecesCount, setPiecesCount] = useState('')
  const { scrollIntoView } = useKeyboardAwareViewport()
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const packagingStructure = line.batch.packagingStructure
  const hasPackaging = !!packagingStructure

  // Handle input focus to ensure visibility
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      scrollIntoView(e.target, 80)
    }, 100)
  }

  // Calculate total quantity from hierarchical inputs
  const calculateHierarchicalTotal = (): number => {
    if (!packagingStructure) return 0

    const cases = parseInt(casesCount) || 0
    const boxes = parseInt(boxesCount) || 0
    const pieces = parseInt(piecesCount) || 0

    let total = 0

    // Add pieces from cases
    if (cases > 0 && packagingStructure.levels.cases) {
      total += cases * packagingStructure.levels.cases.unitsPerCase
    }

    // Add pieces from boxes
    if (boxes > 0 && packagingStructure.levels.boxes) {
      total += boxes * packagingStructure.levels.boxes.unitsPerBox
    }

    // Add loose pieces
    total += pieces

    return total
  }

  const hierarchicalTotal = calculateHierarchicalTotal()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let qty: number
    if (useHierarchical && hasPackaging) {
      qty = hierarchicalTotal
    } else {
      qty = parseInt(countedQty)
    }

    if (!isNaN(qty) && qty >= 0) {
      onRecordCount(line.id, qty)
      // Reset form
      setCountedQty('')
      setCasesCount('')
      setBoxesCount('')
      setPiecesCount('')
    }
  }

  const handleMarkNotFound = () => {
    if (confirm(`Mark batch ${line.batch.batchNumber} as not found? This means the batch could not be located during the physical count.`)) {
      onMarkNotFound(line.id)
    }
  }

  const handleSkip = () => {
    onSkip(line.id)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-24">
      <h3 className="text-lg font-semibold mb-4">Record Count</h3>

      {line.isLocationMismatch && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Location Mismatch</p>
              <p className="mt-1">This batch is from a different location.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm text-gray-600">Batch Number</p>
          <p className="font-medium">{line.batch.batchNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Product</p>
          <p className="font-medium">{line.productName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Expected Quantity</p>
          <p className="font-medium">{line.expectedQuantity} units</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Packaging Structure Toggle */}
        {hasPackaging && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-900">
                {packagingStructure.name}
              </p>
              <button
                type="button"
                onClick={() => setUseHierarchical(!useHierarchical)}
                className="text-xs text-blue-700 hover:text-blue-900 font-medium"
              >
                {useHierarchical ? 'Switch to Simple' : 'Use Packaging'}
              </button>
            </div>
            {packagingStructure.levels.cases && (
              <p className="text-xs text-blue-700">
                {packagingStructure.levels.cases.unitsPerCase} units/case
              </p>
            )}
            {packagingStructure.levels.boxes && (
              <p className="text-xs text-blue-700">
                {packagingStructure.levels.boxes.unitsPerBox} units/box
              </p>
            )}
          </div>
        )}

        {useHierarchical && hasPackaging ? (
          /* Hierarchical Counting Mode */
          <div className="space-y-3">
            {packagingStructure.levels.cases && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cases ({packagingStructure.levels.cases.unitsPerCase} units each)
                </label>
                <input
                  type="number"
                  value={casesCount}
                  onChange={(e) => setCasesCount(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                  autoFocus
                />
              </div>
            )}

            {packagingStructure.levels.boxes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boxes ({packagingStructure.levels.boxes.unitsPerBox} units each)
                </label>
                <input
                  type="number"
                  value={boxesCount}
                  onChange={(e) => setBoxesCount(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loose Pieces
              </label>
              <input
                type="number"
                value={piecesCount}
                onChange={(e) => setPiecesCount(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
              />
            </div>

            {/* Calculated Total */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-sm text-indigo-600">Total Calculated</p>
              <p className="text-2xl font-bold text-indigo-900">{hierarchicalTotal} units</p>
            </div>
          </div>
        ) : (
          /* Simple Counting Mode */
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Counted Quantity
            </label>
            <input
              type="number"
              value={countedQty}
              onChange={(e) => setCountedQty(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Enter counted quantity"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
              min="0"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                useHierarchical && hasPackaging
                  ? hierarchicalTotal === 0
                  : !countedQty || isNaN(parseInt(countedQty))
              }
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Record Count
            </button>
          </div>

          {/* Additional Actions */}
          <div className="pt-2 border-t border-gray-200 space-y-2">
            <button
              type="button"
              onClick={handleMarkNotFound}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Mark as Not Found
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
