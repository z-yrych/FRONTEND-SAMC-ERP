import { useState, useEffect } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/axios'

interface StartStockCountModalProps {
  isOpen: boolean
  onClose: () => void
}

interface WarehouseLocation {
  id: string
  name: string
  isActive: boolean
  batchCount?: number
}

export function StartStockCountModal({ isOpen, onClose }: StartStockCountModalProps) {
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const navigate = useNavigate()

  // Fetch warehouse locations
  useEffect(() => {
    if (isOpen) {
      fetchLocations()
    }
  }, [isOpen])

  const fetchLocations = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/warehouse-locations')
      const data = response.data
      // Backend returns array directly, not wrapped in {data: []}
      const locationsData = Array.isArray(data) ? data : []

      // Fetch batch counts for each location (only batches with available quantity)
      const batchesResponse = await api.get('/inventory/batches?available=true')
      const batchesData = batchesResponse.data
      const batches = Array.isArray(batchesData) ? batchesData : (batchesData.data || [])

      // Count batches per location
      const locationsWithCounts = locationsData.map(location => {
        const batchCount = batches.filter(
          (batch: any) => batch.location === location.name
        ).length
        return { ...location, batchCount }
      })

      setLocations(locationsWithCounts)
    } catch (error) {
      console.error('Failed to fetch locations:', error)
      alert('Failed to load warehouse locations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!selectedLocationId) {
      alert('Please select a warehouse location')
      return
    }

    // Check if selected location has batches
    const selectedLocation = locations.find(l => l.id === selectedLocationId)
    if (selectedLocation && selectedLocation.batchCount === 0) {
      alert('Cannot start stock count: This location has no batches to count. Please add inventory to this location first.')
      return
    }

    setIsStarting(true)
    try {
      const response = await api.post('/inventory/stock-count/sessions', {
        locationId: selectedLocationId,
        startedBy: 'current-user', // TODO: Get from auth context
      })

      const sessionId = response.data.data.id

      // Navigate to stock count session page
      navigate(`/stock-count/${sessionId}`)
      onClose()
    } catch (error: any) {
      console.error('Failed to start stock count session:', error)
      alert(error.response?.data?.message || 'Failed to start stock count session. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start Stock Count</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isStarting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Warehouse Location
            </label>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No warehouse locations found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((location) => {
                  const isEmpty = location.batchCount === 0
                  const isDisabled = !location.isActive || isEmpty

                  return (
                    <label
                      key={location.id}
                      className={`
                        flex items-center p-4 border-2 rounded-lg transition-all
                        ${selectedLocationId === location.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <input
                        type="radio"
                        name="location"
                        value={location.id}
                        checked={selectedLocationId === location.id}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        disabled={isDisabled}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {location.name}
                            </span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            isEmpty
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {location.batchCount ?? 0} {location.batchCount === 1 ? 'batch' : 'batches'}
                          </span>
                        </div>
                        {!location.isActive && (
                          <span className="text-xs text-gray-500 ml-6 block mt-1">Inactive</span>
                        )}
                        {isEmpty && location.isActive && (
                          <span className="text-xs text-red-600 ml-6 block mt-1">No batches to count</span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Starting a stock count session will load all batches in the selected location for physical counting.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isStarting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStartSession}
            disabled={!selectedLocationId || isStarting || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Counting'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
