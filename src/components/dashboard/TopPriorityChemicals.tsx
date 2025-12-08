'use client';

import { useState } from 'react';
import Link from 'next/link';
import SemiCircleProgressBar from 'react-progressbar-semicircle';
import { ChemicalData } from '@/app/api/csv-parser';
import { getChemicalStatusInfo, getPercentileColor, sortChemicalsByPercentile } from '@/app/api/utils';
import { EXPOSURE_COLORS } from '@/lib/colors';
import { ReactElement } from 'react';

interface PercentileDonutChartProps {
  percentile: number;
  value: number;
}

function PercentileDonutChart({ percentile, value }: PercentileDonutChartProps) {
  if (value === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: '180px', height: '100px' }}>
        <div className="text-5xl font-bold text-gray-400">N/D</div>
        <div className="text-xs text-gray-500 mt-1">Not Detected</div>
      </div>
    );
  }

  const percentage = Math.round(percentile * 100);

  // Get color based on percentile
  let strokeColor: string = EXPOSURE_COLORS.lowExposure;
  if (percentile > 0.6) {
    strokeColor = EXPOSURE_COLORS.payAttention;
  } else if (percentile > 0.3) {
    strokeColor = EXPOSURE_COLORS.monitorOnly;
  }

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: '220px', height: '160px' }}>
      <SemiCircleProgressBar
        percentage={percentage}
        stroke={strokeColor}
        strokeWidth={22}
        background="#e5e7eb"
        diameter={220}
        orientation="up"
        direction="right"
        showPercentValue={false}
      />
      {/* Number in center (positioned in the middle of the semicircle area) */}
      <div className="absolute" style={{ top: '70px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 10 }}>
        <div className={`text-6xl font-bold leading-none ${getPercentileColor(percentile, value)}`}>
          {percentage}
        </div>
        <div className="text-xs text-gray-500 mt-1 font-medium">Percentile</div>
      </div>
    </div>
  );
}

// Category icon mapping
const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, ReactElement> = {
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

  return iconMap[categoryName] || (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
};

interface TopPriorityChemicalsProps {
  chemicals: ChemicalData[];
  maxCount?: number;
}


export default function TopPriorityChemicals({ 
  chemicals, 
  maxCount = 8 
}: TopPriorityChemicalsProps) {
  const [selectedChemical, setSelectedChemical] = useState<ChemicalData | null>(null);
  
  const detectedChemicals = chemicals.filter(c => c.value > 0);
  const sortedChemicals = sortChemicalsByPercentile(detectedChemicals);
  // Filter to "Pay Attention" chemicals (percentile > 0.6) or show top chemicals if none
  const priorityChemicals = sortedChemicals.filter(c => (c.percentile || 0) > 0.6);
  const topChemicals = priorityChemicals.length > 0 
    ? priorityChemicals.slice(0, maxCount)
    : sortedChemicals.slice(0, maxCount);

  if (topChemicals.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Top Priority Chemicals</h2>
          <p className="text-gray-600 text-sm">Chemicals requiring the most attention</p>
        </div>
        <div className="text-center py-12 text-gray-500">
          <p>No high-priority chemicals detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-0">Top Priority Chemicals</h2>
      </div>

      {/* Subheader with deselect button - spans left portion only */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            {priorityChemicals.length > 0 
              ? `${priorityChemicals.length} chemical${priorityChemicals.length !== 1 ? 's' : ''} requiring attention`
              : 'Top chemicals by exposure level'
            }
          </p>
          {selectedChemical && (
            <button
              onClick={() => setSelectedChemical(null)}
              className="text-sm text-teal-600 hover:text-teal-700 transition-colors"
              aria-label="Deselect chemical"
            >
              (deselect)
            </button>
          )}
        </div>
        <div className="lg:col-span-1"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Side: Contextual Information */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
          {selectedChemical ? (
            <>
              <div className="rounded-lg pr-6 pt-6 pb-6 w-full flex flex-col flex-1 min-h-0 overflow-hidden relative">

                {/* Top section: Left (percentile, name, category) and Right (stats) */}
                <div className="grid grid-cols-2 gap-6 mb-4 flex-shrink-0 -mt-6">
                  {/* Left side: Percentile indicator, name, and category - centered */}
                  <div className="flex flex-col items-center justify-center pr-6 border-r border-gray-200">
                    <div className="mb-2">
                      <PercentileDonutChart 
                        percentile={selectedChemical.percentile || 0} 
                        value={selectedChemical.value}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2 text-center">{selectedChemical.compound}</h3>
                    <p className="text-sm text-teal-600 font-medium text-center">{selectedChemical.exposureCategory}</p>
                  </div>

                  {/* Right side: Stats in one column with lines separating rows */}
                  <div className="flex flex-col justify-center pl-6 w-full">
                    <div className="w-full pb-2 pt-10 border-b border-gray-200 flex items-center justify-between gap-4">
                      <div className="text-xs text-gray-500">Measured Value</div>
                      <div className="text-sm text-gray-900 text-right">
                        {selectedChemical.value.toLocaleString(undefined, { 
                          minimumFractionDigits: 1, 
                          maximumFractionDigits: 1 
                        })} ng/mL
                      </div>
                    </div>

                    {selectedChemical.rangeLow !== undefined && selectedChemical.rangeHigh !== undefined && (
                      <div className="w-full py-2 border-b border-gray-200 flex items-center justify-between gap-4">
                        <div className="text-xs text-gray-500">Population Range</div>
                        <div className="text-sm text-gray-900 text-right">
                          {selectedChemical.rangeLow.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} - {selectedChemical.rangeHigh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                        </div>
                      </div>
                    )}

                    {selectedChemical.primarySource && (
                      <div className="w-full py-2 border-b border-gray-200 flex items-center justify-between gap-4">
                        <div className="text-xs text-gray-500">Primary Source</div>
                        <div className="text-sm text-gray-900 text-right line-clamp-2">{selectedChemical.primarySource}</div>
                      </div>
                    )}

                    {selectedChemical.secondarySources && (
                      <div className="w-full pt-2 flex items-center justify-between gap-4">
                        <div className="text-xs text-gray-500">Secondary Sources</div>
                        <div className="text-sm text-gray-900 text-right line-clamp-2">{selectedChemical.secondarySources}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom section: Description */}
                <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    A weed-killing chemical used on lawns, golf courses, and some farm crops to stop unwanted plants from growing. You may have come across trace exposures if you&apos;re near areas recently sprayed.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg pr-6 pt-6 pb-6 w-full flex flex-col flex-1 min-h-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex-shrink-0">Understanding Your Combined Exposure</h3>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>
                  Your highest readings mostly involve pesticides that commonly show up in the food supply. They come from routine agricultural use, and many people carry several of them at once through everyday eating patterns. Your values land in the higher part of the population range, which can reflect steadier dietary exposure rather than anything unusual.
                </p>
                <p>
                  The main takeaway is the overall trend: a cluster of food-related pesticide residues that appear together in many people. The site&apos;s individual pages can give you simple, chemical-by-chemical context if you want to dig deeper.
                </p>
              </div>
            </div>
          )}
          
          {/* Buttons row - constrained to left column width */}
          <div className="pt-2 flex items-center justify-between flex-shrink-0">
            {selectedChemical && (
              <Link
                href={`/chemical/${encodeURIComponent(selectedChemical.compound)}?from=dashboard`}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
              >
                View full details
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            {topChemicals.length >= maxCount && (
              <Link 
                href="/exposures?filter=pay-attention"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center ml-auto"
              >
                View all priority chemicals
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: Chemical List with Progress Bars */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-0">
          <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
          {topChemicals.map((chemical) => {
            const isSelected = selectedChemical?.compound === chemical.compound;
            const percentage = Math.round((chemical.percentile || 0) * 100);
            const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
            // Use orange for Pay Attention, dark teal for Monitor Only, light teal for Low Exposure
            const barColor = statusInfo.text === 'Pay Attention' 
              ? EXPOSURE_COLORS.payAttention 
              : statusInfo.text === 'Monitor Only'
              ? EXPOSURE_COLORS.monitorOnly
              : EXPOSURE_COLORS.lowExposure;
            const categoryIcon = getCategoryIcon(chemical.exposureCategory);
            
            return (
              <button
                key={chemical.compound}
                onClick={() => setSelectedChemical(isSelected ? null : chemical)}
                className={`w-full text-left transition-all duration-200 cursor-pointer ${
                  isSelected ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Category Icon */}
                  <div className="text-teal-600 flex-shrink-0 mt-0.5">
                    {categoryIcon}
                  </div>
                  
                  {/* Name and Progress Bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {chemical.compound}
                      </h4>
                      <div className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0">
                        {percentage}%
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: barColor
                        }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}
