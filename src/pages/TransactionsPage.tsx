import { useState } from 'react'
import { TransactionFilters } from '../components/transactions/TransactionFilters'
import { TransactionsTable } from '../components/transactions/TransactionsTable'
import { CreateTransactionModal } from '../components/transactions/CreateTransactionModal'
import { useTransactions } from '../hooks/useTransactions'
import { useProducts } from '../hooks/useProducts'
import { TransactionStatus } from '../lib/api/transactions'

import { useNavigate } from 'react-router-dom'

export function TransactionsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Build filters object
  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(searchQuery && { search: searchQuery })
  }

  const { data: transactions = [], isLoading, error } = useTransactions(filters)
  const { data: products = [] } = useProducts()

  const handleRowClick = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`)
  }

  const handleCreateNew = () => {
    setIsCreateModalOpen(true)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading transactions
          </h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        onSearch={setSearchQuery}
        onStatusFilter={setStatusFilter}
        onCreateNew={handleCreateNew}
        currentStatus={statusFilter}
      />

      {/* Table */}
      <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm border border-gray-200">
        <TransactionsTable
          transactions={transactions}
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Refetch transactions after successful creation
          // This will be handled by React Query automatically
        }}
        products={products}
      />
    </div>
  )
}