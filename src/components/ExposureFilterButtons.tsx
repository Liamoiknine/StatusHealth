'use client';

import { ExposureFilterType } from '@/app/api/utils';

interface ExposureFilterButtonsProps {
  currentFilter: ExposureFilterType;
  onFilterChange: (filter: ExposureFilterType) => void;
}

const filters = [
  { 
    value: 'pay-attention' as const, 
    label: 'Pay Attention'
  },
  { 
    value: 'monitor-only' as const, 
    label: 'Monitor Only'
  },
  { 
    value: 'low-exposure' as const, 
    label: 'Low Exposure'
  },
  { 
    value: 'not-detected' as const, 
    label: 'Not Detected'
  },
  { 
    value: 'all' as const, 
    label: 'All Chemicals'
  }
];

export default function ExposureFilterButtons({ currentFilter, onFilterChange }: ExposureFilterButtonsProps) {
  return (
    <div className="flex items-center space-x-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
            currentFilter === filter.value
              ? 'bg-[#404B69] text-white border-[#404B69] shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

