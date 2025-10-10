import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Package, MapPin, Calendar, Hash, AlertCircle, CheckCircle } from 'lucide-react'
import { BarcodeScanner } from '../components/barcode/BarcodeScanner'
import { useBatchScan } from '../hooks/useBatchScan'

export function BarcodeScannerPage() {
  const navigate = useNavigate()
  const [scannedCode, setScannedCode] = useState<string>('')
  const [manualCode, setManualCode] = useState('')
  const { data: batchDetails, isLoading, error } = useBatchScan(scannedCode)

  const handleScan = (code: string) => {
    console.log('Scanned code:', code)
    setScannedCode(code)
    setManualCode(code)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      setScannedCode(manualCode.trim())
    }
  }

  const handleReset = () => {
    setScannedCode('')
    setManualCode('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'partially_allocated':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'allocated':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'depleted':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'partially_allocated':
        return 'Partially Allocated'
      case 'allocated':
        return 'Fully Allocated'
      case 'depleted':
        return 'Depleted'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Barcode Scanner</h1>
                <p className="text-sm text-gray-500">Scan batch barcodes to check inventory</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="space-y-6">
            {/* Camera Scanner */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Camera Scanner</h2>
              </div>

              <BarcodeScanner onScan={handleScan} />
            </div>

            {/* Manual Entry */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Entry</h2>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter batch number (e.g., BTH-202510-8598)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Look Up
                  </button>
                  {scannedCode && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Batch Details</h2>

            {!scannedCode ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Scan a barcode or enter a batch number to view details</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading batch details...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Batch not found</p>
                    <p className="text-sm text-red-600 mt-1">
                      No batch found with code: <strong>{scannedCode}</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : batchDetails ? (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(batchDetails.status)}`}>
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">{getStatusText(batchDetails.status)}</span>
                </div>

                {/* Batch Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{batchDetails.batch.product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">SKU: {batchDetails.batch.product.sku}</p>
                  </div>

                  {/* Stock Info */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 uppercase">Original</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{batchDetails.batch.originalQuantity}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-600 uppercase">Available</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{batchDetails.batch.availableQuantity}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-yellow-600 uppercase">Allocated</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{batchDetails.batch.allocatedQuantity}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 uppercase">Shipped</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {batchDetails.batch.originalQuantity - batchDetails.batch.availableQuantity - batchDetails.batch.allocatedQuantity}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Batch Number</p>
                        <p className="text-sm font-medium text-gray-900">{batchDetails.batch.batchNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900">{batchDetails.batch.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Received Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(batchDetails.batch.receivedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {batchDetails.batch.expiryDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Expiry Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(batchDetails.batch.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {batchDetails.batch.lotNumber && (
                      <div className="flex items-center gap-3">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Lot Number</p>
                          <p className="text-sm font-medium text-gray-900">{batchDetails.batch.lotNumber}</p>
                        </div>
                      </div>
                    )}

                    {batchDetails.batch.purchaseOrder && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Purchase Order</p>
                          <p className="text-sm font-medium text-gray-900">
                            {batchDetails.batch.purchaseOrder.poNumber}
                            {batchDetails.batch.purchaseOrder.supplier && (
                              <span className="text-gray-500"> • {batchDetails.batch.purchaseOrder.supplier}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Packaging Info */}
                  {batchDetails.batch.packagingStructure && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Packaging: {batchDetails.batch.packagingStructure.name}
                      </p>
                      {batchDetails.batch.packagingBreakdown && (
                        <>
                          <div className="text-sm text-blue-700 mb-2">
                            {Object.entries(batchDetails.batch.packagingBreakdown)
                              .filter(([key]) => key !== 'totalPieces')
                              .map(([key, value], index, array) => (
                                <span key={key}>
                                  {String(value)} {key}
                                  {index < array.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                          </div>
                          {batchDetails.batch.packagingStructure.levels && (
                            <div className="text-xs text-gray-700 space-y-0.5 mt-2 pt-2 border-t border-blue-300">
                              <p className="font-medium text-blue-900 mb-1">Structure Definition:</p>
                              {batchDetails.batch.packagingStructure.levels.level3 && batchDetails.batch.packagingStructure.levels.level2 && (
                                <>
                                  <p>• 1 {batchDetails.batch.packagingStructure.levels.level3.name} = {batchDetails.batch.packagingStructure.levels.level3.contains} {batchDetails.batch.packagingStructure.levels.level2.name}s</p>
                                  <p>• 1 {batchDetails.batch.packagingStructure.levels.level2.name} = {batchDetails.batch.packagingStructure.levels.level2.contains} {batchDetails.batch.packagingStructure.levels.baseUnit.name}s</p>
                                  <p className="font-medium text-blue-800 mt-1">
                                    = 1 {batchDetails.batch.packagingStructure.levels.level3.name} = {batchDetails.batch.packagingStructure.levels.level3.contains * batchDetails.batch.packagingStructure.levels.level2.contains} {batchDetails.batch.packagingStructure.levels.baseUnit.name}s total
                                  </p>
                                </>
                              )}
                              {batchDetails.batch.packagingStructure.levels.level2 && !batchDetails.batch.packagingStructure.levels.level3 && (
                                <p>• 1 {batchDetails.batch.packagingStructure.levels.level2.name} = {batchDetails.batch.packagingStructure.levels.level2.contains} {batchDetails.batch.packagingStructure.levels.baseUnit.name}s</p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Allocations */}
                  {batchDetails.allocations.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Allocations ({batchDetails.allocations.length})</p>
                      <div className="space-y-2">
                        {batchDetails.allocations.map((allocation: any) => (
                          <div key={allocation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {allocation.transactionNumber || 'Direct Allocation'}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {allocation.quantity}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded">
                              {allocation.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
