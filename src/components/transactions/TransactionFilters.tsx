import { useState } from 'react'
import React from 'react'
import { Search, Filter, Plus } from 'lucide-react'
import { TransactionStatus } from '../../lib/api/transactions'
import { useDebounce } from '../../hooks/useDebounce'

interface TransactionFiltersProps {
  onSearch: (query: string) => void
  onStatusFilter: (status: TransactionStatus | 'all') => void
  onCreateNew: () => void
  currentStatus?: TransactionStatus | 'all'
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: TransactionStatus.DRAFT, label: 'Draft' },
  { value: TransactionStatus.SOURCING, label: 'Sourcing' },
  { value: TransactionStatus.QUOTED, label: 'Quoted' },
  { value: TransactionStatus.ACCEPTED, label: 'Accepted' },
  { value: TransactionStatus.PARTIALLY_ALLOCATED, label: 'Partially Allocated' },
  { value: TransactionStatus.WAITING_FOR_ITEMS, label: 'Waiting for Items' },
  { value: TransactionStatus.READY_FOR_DELIVERY, label: 'Ready for Delivery' },
  { value: TransactionStatus.OUT_FOR_DELIVERY, label: 'Out for Delivery' },
  { value: TransactionStatus.DELIVERED, label: 'Delivered' },
  { value: TransactionStatus.COMPLETED, label: 'Completed' },
  { value: TransactionStatus.CANCELLED, label: 'Cancelled' },
]

export function TransactionFilters({
  onSearch,
  onStatusFilter,
  onCreateNew,
  currentStatus = 'all'
}: TransactionFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Call onSearch when debounced value changes
  React.useEffect(() => {
    onSearch(debouncedSearch)
  }, [debouncedSearch, onSearch])

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border-b md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search transactions by #, client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 items-center">
        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select
            value={currentStatus}
            onChange={(e) => onStatusFilter(e.target.value as TransactionStatus | 'all')}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* New Transaction Button */}
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Transaction</span>
        </button>
      </div>
    </div>
  )
}