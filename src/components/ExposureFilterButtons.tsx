import { ExposureFilterType } from '@/app/api/utils';

interface ExposureFilterButtonsProps {
  currentFilter: ExposureFilterType;
  onFilterChange: (filter: ExposureFilterType) => void;
}

export default function ExposureFilterButtons({ currentFilter, onFilterChange }: ExposureFilterButtonsProps) {
  const filters = [
    { value: 'pay-attention' as const, label: 'Pay Attention', activeClass: 'bg-transparent border-red-500 text-red-500' },
    { value: 'monitor-only' as const, label: 'Monitor Only', activeClass: 'bg-transparent border-yellow-500 text-yellow-500' },
    { value: 'low-exposure' as const, label: 'Low Exposure', activeClass: 'bg-transparent border-green-500 text-green-500' },
    { value: 'not-detected' as const, label: 'Not Detected', activeClass: 'bg-transparent border-white text-white' },
    { value: 'all' as const, label: 'All Chemicals', activeClass: 'bg-transparent border-blue-500 text-blue-500' }
  ];

  return (
    <div className="flex items-center space-x-1">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 border cursor-pointer hover:-translate-y-0.5 ${
            currentFilter === filter.value
              ? filter.activeClass
              : 'bg-transparent border-gray-500 text-gray-400 hover:border-gray-400 hover:text-gray-300'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

