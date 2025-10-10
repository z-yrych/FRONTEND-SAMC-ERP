import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
  checked: boolean;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  onChange: (options: FilterOption[]) => void;
}

export function FilterDropdown({ label, options, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (index: number) => {
    const newOptions = [...options];
    newOptions[index].checked = !newOptions[index].checked;
    onChange(newOptions);
  };

  const activeCount = options.filter(opt => opt.checked).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm">{label}</span>
        {activeCount > 0 && (
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
            {activeCount}
          </span>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
            <div className="p-2 space-y-1">
              {options.map((option, index) => (
                <label key={option.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.checked}
                    onChange={() => handleToggle(index)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
