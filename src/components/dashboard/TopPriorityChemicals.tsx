'use client';

import { useState } from 'react';
import Link from 'next/link';
import SemiCircleProgressBar from 'react-progressbar-semicircle';
import { ChemicalData } from '@/app/api/csv-parser';
import { getChemicalStatusInfo, formatPercentile, getPercentileColor, sortChemicalsByPercentile } from '@/app/api/utils';
import { EXPOSURE_COLORS } from '@/lib/colors';

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
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Top Priority Chemicals</h2>
        <p className="text-gray-600 text-sm">
          {priorityChemicals.length > 0 
            ? `${priorityChemicals.length} chemical${priorityChemicals.length !== 1 ? 's' : ''} requiring attention`
            : 'Top chemicals by exposure level'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Side: Contextual Information */}
        <div className="lg:col-span-2 flex min-h-0">
          {selectedChemical ? (
            <div className="border border-gray-200 rounded-lg p-6 w-full flex flex-col h-full overflow-hidden relative">
              <div className="flex items-start justify-between mb-4 flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{selectedChemical.compound}</h3>
                  <p className="text-sm text-teal-600 font-medium">{selectedChemical.exposureCategory}</p>
                </div>
                <button
                  onClick={() => setSelectedChemical(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                  aria-label="Close preview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-2" style={{ maxHeight: 'calc(100% - 60px)' }}>
                <div className="grid grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Measured Value</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedChemical.value.toLocaleString(undefined, { 
                        minimumFractionDigits: 1, 
                        maximumFractionDigits: 1 
                      })} ng/mL
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <PercentileDonutChart 
                      percentile={selectedChemical.percentile || 0} 
                      value={selectedChemical.value}
                    />
                  </div>
                </div>

                {selectedChemical.primarySource && (
                  <div className="flex-shrink-0">
                    <div className="text-xs text-gray-500 mb-1">Primary Source</div>
                    <div className="text-sm text-gray-900 line-clamp-2">{selectedChemical.primarySource}</div>
                  </div>
                )}

                {selectedChemical.secondarySources && (
                  <div className="flex-shrink-0">
                    <div className="text-xs text-gray-500 mb-1">Secondary Sources</div>
                    <div className="text-sm text-gray-900 line-clamp-2">{selectedChemical.secondarySources}</div>
                  </div>
                )}

                {selectedChemical.rangeLow !== undefined && selectedChemical.rangeHigh !== undefined && (
                  <div className="flex-shrink-0">
                    <div className="text-xs text-gray-500 mb-1">Population Range</div>
                    <div className="text-sm text-gray-900">
                      {selectedChemical.rangeLow.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} - {selectedChemical.rangeHigh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                    </div>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-6 right-6 flex-shrink-0">
                <Link
                  href={`/chemical/${encodeURIComponent(selectedChemical.compound)}?from=dashboard`}
                  className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  View full details
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6 w-full flex flex-col h-full overflow-hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex-shrink-0">Understanding Your Combined Exposure</h3>
              <div className="text-gray-700 leading-relaxed space-y-4 flex-1 overflow-y-auto min-h-0 pr-2" style={{ maxHeight: 'calc(100% - 100px)' }}>
                <p>
                  Your highest readings mostly involve pesticides that commonly show up in the food supply. They come from routine agricultural use, and many people carry several of them at once through everyday eating patterns. Your values land in the higher part of the population range, which can reflect steadier dietary exposure rather than anything unusual.
                </p>
                <p>
                  The main takeaway is the overall trend: a cluster of food-related pesticide residues that appear together in many people. The site's individual pages can give you simple, chemical-by-chemical context if you want to dig deeper.
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-4 flex-shrink-0">
                Click on any chemical on the right to view detailed information about that specific compound.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Stack of Compact Chemical Cards */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-0">
          <div className="space-y-1.5 overflow-y-auto pr-2 flex-1 min-h-0">
          {topChemicals.map((chemical) => {
            const percentileColor = getPercentileColor(chemical.percentile, chemical.value);
            const isSelected = selectedChemical?.compound === chemical.compound;
            
            return (
              <button
                key={chemical.compound}
                onClick={() => setSelectedChemical(isSelected ? null : chemical)}
                className={`w-full text-left border rounded-lg px-3 py-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className={`text-sm font-semibold line-clamp-1 flex-1 min-w-0 ${
                    isSelected ? 'text-gray-900' : 'text-gray-900'
                  }`}>
                    {chemical.compound}
                  </h4>
                  <div className={`flex-shrink-0 ${percentileColor} text-sm font-bold`}>
                    {formatPercentile(chemical.percentile, chemical.value)}
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {topChemicals.length >= maxCount && (
        <div className="pt-2">
          <Link 
            href="/exposures?filter=pay-attention"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
          >
            View all priority chemicals
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
