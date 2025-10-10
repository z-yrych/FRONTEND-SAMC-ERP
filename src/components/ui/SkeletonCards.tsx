import { Skeleton, SkeletonText, SkeletonHeading } from './Skeleton';

/**
 * Skeleton for transaction/quote card in modals
 * Matches the structure used in SendClientQuoteModal, AcceptClientQuoteModal, etc.
 */
export function TransactionCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-4">
        {/* Checkbox placeholder */}
        <Skeleton variant="rectangular" className="w-5 h-5 mt-1" />

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            {/* Left side - Title and status */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <SkeletonHeading className="w-32" />
                <Skeleton className="w-16 h-5" />
              </div>
              <SkeletonText className="w-48 mb-1" />
              <SkeletonText className="w-40" />
            </div>

            {/* Right side - Amount */}
            <div className="text-right ml-4">
              <Skeleton className="w-24 h-6 mb-1" />
              <Skeleton className="w-16 h-4" />
            </div>
          </div>

          {/* Line items preview */}
          <div className="mt-3 space-y-1">
            <SkeletonText className="w-full" />
            <SkeletonText className="w-4/5" />
          </div>

          {/* Footer info */}
          <div className="mt-2 flex gap-4">
            <Skeleton className="w-32 h-3" />
            <Skeleton className="w-28 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for a list of transaction/quote cards
 */
export function TransactionCardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <TransactionCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Skeleton for dashboard stat card
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-24 h-5" />
        <Skeleton variant="circular" className="w-10 h-10" />
      </div>
      <Skeleton className="w-16 h-8 mb-2" />
      <SkeletonText className="w-32" />
    </div>
  );
}

/**
 * Skeleton for dashboard overview section
 */
export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <SkeletonHeading className="w-48 mb-2" />
        <SkeletonText className="w-64" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="w-32 h-10" />
        <Skeleton className="w-40 h-10" />
        <Skeleton className="w-36 h-10" />
      </div>
    </div>
  );
}

/**
 * Skeleton for empty state with icon
 */
export function EmptyStateSkeleton() {
  return (
    <div className="text-center py-12">
      <Skeleton variant="circular" className="w-16 h-16 mx-auto mb-4" />
      <SkeletonHeading className="w-48 mx-auto mb-2" />
      <SkeletonText className="w-64 mx-auto" />
    </div>
  );
}
