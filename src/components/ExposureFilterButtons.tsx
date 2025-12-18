'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const activeIndex = filters.findIndex(f => f.value === currentFilter);
    const activeButton = buttonRefs.current[activeIndex];
    const container = containerRef.current;

    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const underlineWidth = buttonRect.width * 0.7; // 70% of button width
      const underlineLeft = buttonRect.left - containerRect.left + (buttonRect.width - underlineWidth) / 2; // Center the underline
      
      setUnderlineStyle({
        left: underlineLeft,
        width: underlineWidth
      });
    }
  }, [currentFilter]);

  return (
    <div ref={containerRef} className="relative flex items-center space-x-2">
      {filters.map((filter, index) => (
        <button
          key={filter.value}
          ref={(el) => { buttonRefs.current[index] = el; }}
          onClick={() => onFilterChange(filter.value)}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
            currentFilter === filter.value
              ? 'text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {filter.label}
        </button>
      ))}
      <div
        className="absolute bottom-0 h-1.5 bg-[#9CBB04] transition-all duration-300 ease-in-out"
        style={{
          left: `${underlineStyle.left}px`,
          width: `${underlineStyle.width}px`
        }}
      />
    </div>
  );
}

