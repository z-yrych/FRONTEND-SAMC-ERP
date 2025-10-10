import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Base Skeleton component for loading states
 *
 * Usage:
 * <Skeleton className="h-4 w-32" />
 * <Skeleton variant="circular" className="h-12 w-12" />
 */
export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200';
  const animateStyles = animate ? 'animate-pulse' : '';

  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseStyles,
        animateStyles,
        variantStyles[variant],
        className
      )}
      style={style}
    />
  );
}

/**
 * Skeleton for a single line of text
 */
export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton variant="text" className={cn('h-4 w-full', className)} />;
}

/**
 * Skeleton for a heading
 */
export function SkeletonHeading({ className }: { className?: string }) {
  return <Skeleton variant="text" className={cn('h-6 w-3/4', className)} />;
}

/**
 * Skeleton for an avatar/profile picture
 */
export function SkeletonAvatar({ className }: { className?: string }) {
  return <Skeleton variant="circular" className={cn('h-10 w-10', className)} />;
}

/**
 * Skeleton for a button
 */
export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-24', className)} />;
}
