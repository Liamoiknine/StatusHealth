import { ExposureFilterType } from '@/app/api/utils';

interface ExposureFilterButtonsProps {
  currentFilter: ExposureFilterType;
  onFilterChange: (filter: ExposureFilterType) => void;
}

export default function ExposureFilterButtons({ currentFilter, onFilterChange }: ExposureFilterButtonsProps) {
  const filters = [
    { value: 'pay-attention' as const, label: 'Pay Attention', activeClass: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'monitor-only' as const, label: 'Monitor Only', activeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'low-exposure' as const, label: 'Low Exposure', activeClass: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'not-detected' as const, label: 'Not Detected', activeClass: 'bg-gray-100 text-gray-700 border-gray-300' },
    { value: 'all' as const, label: 'All Chemicals', activeClass: 'bg-blue-100 text-blue-700 border-blue-200' }
  ];

  return (
    <div className="flex items-center space-x-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors border ${
            currentFilter === filter.value
              ? filter.activeClass
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

