import { ExposureFilterType } from '@/app/api/utils';

interface ExposureFilterButtonsProps {
  currentFilter: ExposureFilterType;
  onFilterChange: (filter: ExposureFilterType) => void;
}

export default function ExposureFilterButtons({ currentFilter, onFilterChange }: ExposureFilterButtonsProps) {
  const filters = [
    { 
      value: 'pay-attention' as const, 
      label: 'Pay Attention', 
      activeClass: 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100',
      inactiveClass: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
    },
    { 
      value: 'monitor-only' as const, 
      label: 'Monitor Only', 
      activeClass: 'bg-yellow-50 border-yellow-500 text-yellow-600 hover:bg-yellow-100',
      inactiveClass: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
    },
    { 
      value: 'low-exposure' as const, 
      label: 'Low Exposure', 
      activeClass: 'bg-green-50 border-green-500 text-green-600 hover:bg-green-100',
      inactiveClass: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
    },
    { 
      value: 'not-detected' as const, 
      label: 'Not Detected', 
      activeClass: 'bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-200',
      inactiveClass: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
    },
    { 
      value: 'all' as const, 
      label: 'All Chemicals', 
      activeClass: 'bg-[#1a2540] border-[#1a2540] text-white hover:bg-[#1a2540]/90',
      inactiveClass: 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
    }
  ];

  return (
    <div className="flex items-center space-x-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border cursor-pointer shadow-sm hover:-translate-y-0.5 hover:shadow-md ${
            currentFilter === filter.value
              ? filter.activeClass
              : filter.inactiveClass
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

