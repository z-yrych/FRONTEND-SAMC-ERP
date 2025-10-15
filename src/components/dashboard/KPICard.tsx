import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  iconColor,
  borderColor,
  subtitle,
  trend,
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border-2 ${borderColor} p-7 animate-pulse`}>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border-2 ${borderColor} p-7 hover:shadow-md transition-shadow h-full flex flex-col`}>
      <div className="flex items-start justify-between mb-auto">
        <div className="flex-1">
          <p className="text-base font-medium text-gray-600 h-6 leading-6">{title}</p>
          <p className={`text-4xl font-bold ${iconColor} mt-6 leading-none`}>
            {typeof value === 'number' && value >= 1000
              ? value.toLocaleString()
              : value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <Icon className={`w-14 h-14 ${iconColor} opacity-20 flex-shrink-0`} />
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-4">{subtitle}</p>
      )}
    </div>
  );
}
