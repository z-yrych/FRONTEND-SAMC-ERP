import { X, Printer, Download } from 'lucide-react'
import { useState } from 'react'
import api from '../../lib/axios'

interface Batch {
  batchNumber: string
  productName: string
  quantity: number
  location: string
}

interface BatchLabelPrintDialogProps {
  isOpen: boolean
  onClose: () => void
  batches: Batch[]
}

export function BatchLabelPrintDialog({ isOpen, onClose, batches }: BatchLabelPrintDialogProps) {
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set(batches.map(b => b.batchNumber)))
  const [isPrinting, setIsPrinting] = useState(false)

  if (!isOpen) return null

  const handleToggleBatch = (batchNumber: string) => {
    const newSelected = new Set(selectedBatches)
    if (newSelected.has(batchNumber)) {
      newSelected.delete(batchNumber)
    } else {
      newSelected.add(batchNumber)
    }
    setSelectedBatches(newSelected)
  }

  const handleToggleAll = () => {
    if (selectedBatches.size === batches.length) {
      setSelectedBatches(new Set())
    } else {
      setSelectedBatches(new Set(batches.map(b => b.batchNumber)))
    }
  }

  const handlePrintSelected = async () => {
    if (selectedBatches.size === 0) return

    setIsPrinting(true)
    try {
      // Download each selected batch label
      for (const batchNumber of Array.from(selectedBatches)) {
        const response = await api.get(`/inventory/batches/label/${batchNumber}`, {
          responseType: 'blob'
        })

        const blob = response.data
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `label-${batchNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      onClose()
    } catch (error) {
      console.error('Failed to print labels:', error)
      alert('Failed to download labels. Please try again.')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Print Barcode Labels</h2>
            <p className="text-sm text-gray-500 mt-1">
              {batches.length} batch{batches.length !== 1 ? 'es' : ''} created - Select labels to print
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-96">
          {/* Select All */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={selectedBatches.size === batches.length && batches.length > 0}
                onChange={handleToggleAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              Select All ({selectedBatches.size} of {batches.length} selected)
            </label>
          </div>

          {/* Batch List */}
          <div className="space-y-2">
            {batches.map((batch) => (
              <label
                key={batch.batchNumber}
                className={`
                  flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedBatches.has(batch.batchNumber)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={selectedBatches.has(batch.batchNumber)}
                  onChange={() => handleToggleBatch(batch.batchNumber)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{batch.productName}</p>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1">
                    <span>Batch: {batch.batchNumber}</span>
                    <span>Qty: {batch.quantity}</span>
                    <span>Location: {batch.location}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={isPrinting}
          >
            Skip
          </button>
          <button
            onClick={handlePrintSelected}
            disabled={selectedBatches.size === 0 || isPrinting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPrinting ? (
              <>
                <Download className="w-4 h-4 animate-pulse" />
                Downloading...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Print {selectedBatches.size} Label{selectedBatches.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
