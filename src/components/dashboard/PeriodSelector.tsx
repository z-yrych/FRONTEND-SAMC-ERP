import { Calendar } from 'lucide-react';

export type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

interface PeriodSelectorProps {
  selectedPeriod: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ selectedPeriod, onChange }: PeriodSelectorProps) {
  const periods: { value: Period; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'year', label: 'Last Year' },
  ];

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-2">
      <Calendar className="w-5 h-5 text-gray-400 ml-2" />
      <div className="flex gap-1">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === period.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
