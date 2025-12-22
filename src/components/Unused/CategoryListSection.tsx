'use client';

import { ChemicalData } from '@/app/api/csv-parser';
import { getCategoryStatusInfo } from '@/app/api/utils';
import { EXPOSURE_COLORS } from '@/lib/colors';

interface CategoryListSectionProps {
  categories: Array<{
    name: string;
    chemicals: ChemicalData[];
    detectedCount: number;
    totalCount: number;
  }>;
}

export default function CategoryListSection({ categories }: CategoryListSectionProps) {
  // Get category icon
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'Agricultural Chemicals': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      ),
      'Containers & Coatings': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/>
          <path d="M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/>
          <path d="M3 7h18"/>
          <path d="M7 7v10"/>
          <path d="M17 7v10"/>
        </svg>
      ),
      'Household Products': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <path d="M9 22V12h6v10"/>
        </svg>
      ),
      'Industrial Chemicals': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      ),
      'Persistent Pollutants': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="M4 12H2"/>
          <path d="M22 12h-2"/>
          <path d="m15.536 15.536 1.414 1.414"/>
          <path d="m7.05 7.05-1.414-1.414"/>
          <path d="m15.536 8.464 1.414-1.414"/>
          <path d="m7.05 16.95-1.414 1.414"/>
          <circle cx="12" cy="12" r="4"/>
        </svg>
      ),
      'Personal Care Products': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          <path d="M8 12h8"/>
          <path d="M12 8v8"/>
        </svg>
      ),
    };
    return iconMap[categoryName] || null;
  };

  const maxDetected = Math.max(...categories.map(c => c.detectedCount), 1);

  return (
    <div className="flex flex-col space-y-4">
      {categories.map((category) => {
        const categoryStatusInfo = getCategoryStatusInfo(category.chemicals);
        const barWidth = (category.detectedCount / maxDetected) * 100;
        
        // Get the color based on classification
        const getBarColor = (): string => {
          if (categoryStatusInfo.text === 'Pay Attention') {
            return EXPOSURE_COLORS.payAttention;
          } else if (categoryStatusInfo.text === 'Monitor Only') {
            return EXPOSURE_COLORS.monitorOnly;
          } else {
            return EXPOSURE_COLORS.lowExposure;
          }
        };
        const barColor = getBarColor();
        
        return (
          <div key={category.name} className="flex items-start gap-3">
            {/* Icon */}
            <div className="text-[#9CBB04] mt-0.5 flex-shrink-0">
              {getCategoryIcon(category.name)}
            </div>
            
            {/* Name and Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
                <span className="text-sm font-semibold text-gray-900 ml-2">{category.detectedCount}</span>
              </div>
              {/* Indicator Bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${barWidth}%`,
                    backgroundColor: barColor
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

