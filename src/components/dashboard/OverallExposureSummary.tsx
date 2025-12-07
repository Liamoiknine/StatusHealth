'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChemicalData } from '@/app/api/csv-parser';
import { getPercentileDistribution } from '@/app/api/utils';
import { EXPOSURE_COLORS, EXPOSURE_COLOR_CLASSES } from '@/lib/colors';

interface OverallExposureSummaryProps {
  chemicals: ChemicalData[];
}

export default function OverallExposureSummary({ chemicals }: OverallExposureSummaryProps) {
  const router = useRouter();
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  
  const totalChemicals = chemicals.length;
  const detectedChemicals = chemicals.filter(c => c.value > 0);
  const detectedCount = detectedChemicals.length;
  const detectionRate = totalChemicals > 0 ? Math.round((detectedCount / totalChemicals) * 100) : 0;
  
  const distribution = getPercentileDistribution(chemicals);
  
  // Calculate average percentile of detected chemicals
  const avgPercentile = detectedChemicals.length > 0
    ? detectedChemicals.reduce((sum, c) => sum + (c.percentile || 0), 0) / detectedChemicals.length
    : 0;

  const handleMetricClick = (filter: 'all' | 'pay-attention' | 'monitor-only' | 'low-exposure' | 'not-detected') => {
    router.push(`/exposures?filter=${filter}`);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Total Chemicals */}
        <div 
          className="space-y-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
          onClick={() => router.push('/exposures')}
          onMouseEnter={() => setHoveredMetric('total')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Tested</div>
          <div className="text-3xl font-bold text-gray-900">{totalChemicals}</div>
          {hoveredMetric === 'total' && (
            <div className="text-xs text-teal-600 mt-1">Click to view all</div>
          )}
        </div>

        {/* Detected Count */}
        <div 
          className="space-y-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          onClick={() => handleMetricClick('all')}
          onMouseEnter={() => setHoveredMetric('detected')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Detected</div>
          <div className="text-3xl font-bold text-teal-600">{detectedCount}</div>
          <div className="text-xs text-gray-500">{detectionRate}% detection rate</div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
            <div 
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${detectionRate}%` }}
            />
          </div>
          {hoveredMetric === 'detected' && (
            <div className="text-xs text-teal-600 mt-1">Click to view detected</div>
          )}
        </div>

        {/* Average Percentile */}
        <div 
          className="space-y-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleMetricClick('all')}
          onMouseEnter={() => setHoveredMetric('percentile')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Percentile</div>
          <div className="text-3xl font-bold text-[#1a2540]">
            {avgPercentile > 0 ? `${Math.round(avgPercentile * 100)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500">of detected</div>
          {hoveredMetric === 'percentile' && avgPercentile > 0 && (
            <div className="text-xs text-teal-600 mt-1">Click to view details</div>
          )}
        </div>

        {/* Low Exposure */}
        <div 
          className="space-y-2 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
          style={{ '--hover-border-color': EXPOSURE_COLORS.lowExposure } as React.CSSProperties & { '--hover-border-color': string }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = EXPOSURE_COLORS.lowExposure}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          onClick={() => handleMetricClick('low-exposure')}
          onMouseEnter={() => setHoveredMetric('low')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Low Exposure</div>
          <div className={`text-3xl font-bold ${EXPOSURE_COLOR_CLASSES.lowExposure.text}`}>{distribution.lowExposure}</div>
          <div className="text-xs text-gray-500">0-30th percentile</div>
          {hoveredMetric === 'low' && (
            <div className="text-xs text-teal-600 mt-1">Click to view</div>
          )}
        </div>

        {/* Monitor + Pay Attention */}
        <div 
          className="space-y-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-yellow-300 hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleMetricClick('monitor-only')}
          onMouseEnter={() => setHoveredMetric('monitor')}
          onMouseLeave={() => setHoveredMetric(null)}
        >
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monitor / Alert</div>
          <div className="text-3xl font-bold text-yellow-600">
            {distribution.monitorOnly + distribution.payAttention}
          </div>
          <div className="text-xs text-gray-500">
            {distribution.monitorOnly} monitor, {distribution.payAttention} alert
          </div>
          {hoveredMetric === 'monitor' && (
            <div className="text-xs text-teal-600 mt-1">Click to view</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-3">
          <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
          {distribution.payAttention > 0 && (
            <Link
              href="/exposures?filter=pay-attention"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
            >
              View {distribution.payAttention} priority chemical{distribution.payAttention !== 1 ? 's' : ''}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          <Link
            href="/exposures"
            className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
          >
            View all exposures
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

