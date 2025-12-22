'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CategoryLongitudinalResponse } from '@/app/api/chemicals/longitudinal/category/route';

interface CategoryTimelineChartProps {
  categoryName: string;
}

interface TooltipPayload {
  payload: {
    fullDate: string;
    averagePercentile: number | null;
    detectionRate: number;
    totalDetected: number;
    totalChemicals: number;
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

export default function CategoryTimelineChart({ categoryName }: CategoryTimelineChartProps) {
  const [data, setData] = useState<CategoryLongitudinalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'percentile' | 'detectionRate'>('percentile');
  const [openTooltip, setOpenTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);
  const tooltipRef = useRef<HTMLButtonElement>(null);
  const [openHeaderTooltip, setOpenHeaderTooltip] = useState(false);
  const [headerTooltipPosition, setHeaderTooltipPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);
  const headerTooltipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function fetchCategoryLongitudinalData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/chemicals/longitudinal/category?category=${encodeURIComponent(categoryName)}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch category longitudinal data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (categoryName) {
      fetchCategoryLongitudinalData();
    }
  }, [categoryName]);

  // Calculate tooltip position when opened
  useEffect(() => {
    const updatePosition = () => {
      if (openTooltip && tooltipRef.current) {
        const button = tooltipRef.current;
        const rect = button.getBoundingClientRect();
        const tooltipWidth = 256; // w-64 = 256px
        const tooltipHeight = 120; // Approximate height
        const spacing = 8; // Space between button and tooltip
        
        // Calculate left position: align right edge of tooltip with right edge of button
        let left = rect.right - tooltipWidth;
        
        // Ensure tooltip doesn't go off the left edge of screen
        if (left < 8) {
          left = 8;
        }
        
        // Ensure tooltip doesn't go off the right edge of screen
        if (rect.right > window.innerWidth - 8) {
          left = window.innerWidth - tooltipWidth - 8;
        }
        
        // Calculate top position: position above the button
        let top = rect.top - spacing;
        let placement: 'above' | 'below' = 'above';
        
        // If tooltip would go above viewport, position it below the button instead
        if (top < tooltipHeight + 8) {
          top = rect.bottom + spacing;
          placement = 'below';
        }
        
        setTooltipPosition({
          top: top,
          left: left,
          placement: placement,
        });
      } else {
        setTooltipPosition(null);
      }
    };

    updatePosition();
    
    // Update position on scroll and resize
    if (openTooltip) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [openTooltip]);

  // Calculate header tooltip position when opened
  useEffect(() => {
    const updateHeaderPosition = () => {
      if (openHeaderTooltip && headerTooltipRef.current) {
        const button = headerTooltipRef.current;
        const rect = button.getBoundingClientRect();
        const tooltipWidth = 280; // Wider for more content
        const tooltipHeight = 180; // Taller for more content
        const spacing = 8;
        
        // Calculate left position: align right edge of tooltip with right edge of button
        let left = rect.right - tooltipWidth;
        
        // Ensure tooltip doesn't go off the left edge of screen
        if (left < 8) {
          left = 8;
        }
        
        // Ensure tooltip doesn't go off the right edge of screen
        if (rect.right > window.innerWidth - 8) {
          left = window.innerWidth - tooltipWidth - 8;
        }
        
        // Calculate top position: position above the button
        let top = rect.top - spacing;
        let placement: 'above' | 'below' = 'above';
        
        // If tooltip would go above viewport, position it below the button instead
        if (top < tooltipHeight + 8) {
          top = rect.bottom + spacing;
          placement = 'below';
        }
        
        setHeaderTooltipPosition({
          top: top,
          left: left,
          placement: placement,
        });
      } else {
        setHeaderTooltipPosition(null);
      }
    };

    updateHeaderPosition();
    
    // Update position on scroll and resize
    if (openHeaderTooltip) {
      window.addEventListener('scroll', updateHeaderPosition, true);
      window.addEventListener('resize', updateHeaderPosition);
      return () => {
        window.removeEventListener('scroll', updateHeaderPosition, true);
        window.removeEventListener('resize', updateHeaderPosition);
      };
    }
  }, [openHeaderTooltip]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-tooltip-trigger]') && !target.closest('[data-tooltip-content]')) {
        setOpenTooltip(false);
        setOpenHeaderTooltip(false);
      }
    };

    if (openTooltip || openHeaderTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openTooltip, openHeaderTooltip]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9CBB04]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
        </h3>
        <div className="text-center text-red-600 py-8">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData || data.data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
        </h3>
        <div className="text-center text-gray-600 py-8">
          <p>Insufficient historical data available for this category</p>
        </div>
      </div>
    );
  }

  const chartData = data.data.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    fullDate: point.date,
    averagePercentile: point.averagePercentile ? Math.round(point.averagePercentile * 100) : null,
    detectionRate: Math.round(point.detectionRate * 100),
    totalDetected: point.totalDetected,
    totalChemicals: point.totalChemicals,
    testId: point.testId
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">{data.fullDate}</p>
          {metric === 'percentile' && data.averagePercentile !== null && (
            <p className="text-[#9CBB04]">
              <span className="text-gray-600">Avg Percentile: </span>
              {data.averagePercentile}%
            </p>
          )}
          {metric === 'detectionRate' && (
            <p className="text-[#9CBB04]">
              <span className="text-gray-600">Detection Rate: </span>
              {data.detectionRate}%
            </p>
          )}
          <p className="text-gray-600 text-xs mt-1">
            {data.totalDetected} of {data.totalChemicals} detected
          </p>
        </div>
      );
    }
    return null;
  };

  const hasPercentileData = chartData.some(d => d.averagePercentile !== null);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
          <button
            ref={headerTooltipRef}
            onClick={() => setOpenHeaderTooltip(!openHeaderTooltip)}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Information about Category Trends"
            data-tooltip-trigger
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          {openHeaderTooltip && headerTooltipPosition && typeof window !== 'undefined' && createPortal(
            <div 
              className="fixed z-[9999] bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
              data-tooltip-content
              style={{ 
                top: `${headerTooltipPosition.top}px`,
                left: `${headerTooltipPosition.left}px`,
                transform: headerTooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none',
                width: '280px'
              }}
            >
              <p className="font-semibold mb-2">Understanding Category Trends</p>
              <p className="mb-2"><strong>Percentile:</strong> Shows how your exposure levels compare to the general population. A higher percentile means your exposure is higher than most people.</p>
              <p><strong>Detection Rate:</strong> The percentage of chemicals in this category that were detected in your test. This shows how many different chemicals you're exposed to within this category.</p>
              <div className={`absolute ${headerTooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
            </div>,
            document.body
          )}
        </h3>
        {hasPercentileData && (
          <div className="flex gap-2">
            <button
              onClick={() => setMetric('percentile')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                metric === 'percentile'
                  ? 'bg-[#9CBB04] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Percentile
            </button>
            <button
              onClick={() => setMetric('detectionRate')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                metric === 'detectionRate'
                  ? 'bg-[#9CBB04] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Detection Rate
            </button>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {metric === 'percentile' && hasPercentileData ? (
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <defs>
              <linearGradient id="colorPercentile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9CBB04" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#9CBB04" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="averagePercentile"
              stroke="#9CBB04"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPercentile)"
            />
            <Line
              type="monotone"
              dataKey="averagePercentile"
              stroke="#9CBB04"
              strokeWidth={2}
              dot={{ fill: '#9CBB04', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <defs>
              <linearGradient id="colorDetection" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="detectionRate"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDetection)"
            />
            <Line
              type="monotone"
              dataKey="detectionRate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      <div className="mt-3 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${metric === 'percentile' && hasPercentileData ? 'bg-[#9CBB04]' : 'bg-blue-500'}`} />
          <span className="text-gray-700">
            {metric === 'percentile' && hasPercentileData ? 'Average Exposure Percentile' : 'Detection Rate'}
          </span>
          {metric === 'percentile' && hasPercentileData && (
            <>
              <button
                ref={tooltipRef}
                onClick={() => setOpenTooltip(!openTooltip)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Information about Average Exposure Percentile"
                data-tooltip-trigger
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {openTooltip && tooltipPosition && typeof window !== 'undefined' && createPortal(
                <div 
                  className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                  data-tooltip-content
                  style={{ 
                    top: `${tooltipPosition.top}px`,
                    left: `${tooltipPosition.left}px`,
                    transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                  }}
                >
                  <p>The average percentile rank of all detected chemicals in this category across your test history. This shows how your exposure levels compare to the general population over time.</p>
                  <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
                </div>,
                document.body
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

