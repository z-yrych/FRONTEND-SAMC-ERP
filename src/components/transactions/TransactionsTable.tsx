import { format } from 'date-fns'
import { Eye, Loader2 } from 'lucide-react'
import type { Transaction } from '../../lib/api/transactions'
import { StatusBadge } from '../ui/StatusBadge'

interface TransactionsTableProps {
  transactions: Transaction[]
  isLoading: boolean
  onRowClick: (id: string) => void
}

export function TransactionsTable({ transactions, isLoading, onRowClick }: TransactionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading transactions...</span>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No transactions found</div>
        <p className="text-gray-500">Create your first transaction to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left p-4 font-medium text-gray-700">Transaction #</th>
            <th className="text-left p-4 font-medium text-gray-700">Client Name</th>
            <th className="text-left p-4 font-medium text-gray-700">Status</th>
            <th className="text-left p-4 font-medium text-gray-700">Date</th>
            <th className="w-16"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => onRowClick(transaction.id)}
            >
              <td className="p-4">
                <span className="font-mono text-sm font-medium text-blue-600">
                  {transaction.transactionNumber}
                </span>
              </td>
              <td className="p-4">
                <span className="font-medium text-gray-900">
                  {transaction.client.name}
                </span>
              </td>
              <td className="p-4">
                <StatusBadge status={transaction.status} size="sm" />
              </td>

              <td className="p-4">
                <span className="text-gray-600">
                  {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                </span>
              </td>
              <td className="p-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRowClick(transaction.id)
                  }}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}