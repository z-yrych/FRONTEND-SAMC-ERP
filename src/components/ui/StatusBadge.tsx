import { TransactionStatus } from '../../lib/api/transactions'

interface StatusBadgeProps {
  status: TransactionStatus
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
  [TransactionStatus.DRAFT]: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  [TransactionStatus.SOURCING]: {
    label: 'Sourcing',
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  [TransactionStatus.QUOTED]: {
    label: 'Quoted',
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  [TransactionStatus.ACCEPTED]: {
    label: 'Accepted',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  [TransactionStatus.PARTIALLY_ALLOCATED]: {
    label: 'Partially Allocated',
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  [TransactionStatus.WAITING_FOR_ITEMS]: {
    label: 'Waiting for Items',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  },
  [TransactionStatus.READY_FOR_DELIVERY]: {
    label: 'Ready for Delivery',
    color: 'bg-teal-100 text-teal-800 border-teal-300'
  },
  [TransactionStatus.OUT_FOR_DELIVERY]: {
    label: 'Out for Delivery',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  },
  [TransactionStatus.DELIVERED]: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  [TransactionStatus.COMPLETED]: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  [TransactionStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800 border-red-300'
  }
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`
      inline-flex items-center rounded-full border font-medium
      ${config.color}
      ${sizeClasses[size]}
    `}>
      {config.label}
    </span>
  )
}