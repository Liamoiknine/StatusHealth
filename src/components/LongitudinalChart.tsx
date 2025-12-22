'use client';

import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ComposedChart } from 'recharts';
import { createPortal } from 'react-dom';
import { LongitudinalDataPoint, LongitudinalResponse } from '@/app/api/chemicals/longitudinal/route';

interface LongitudinalChartProps {
  chemicalName: string;
}

export default function LongitudinalChart({ chemicalName }: LongitudinalChartProps) {
  const [data, setData] = useState<LongitudinalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLongitudinalData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/chemicals/longitudinal?chemical=${encodeURIComponent(chemicalName)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch longitudinal data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLongitudinalData();
  }, [chemicalName]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-lg shadow-sm p-6 relative">
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CBB04] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#404B69] rounded-full blur-3xl"></div>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exposure Over Time</h2>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9CBB04]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-lg shadow-sm p-6 relative">
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CBB04] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#404B69] rounded-full blur-3xl"></div>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exposure Over Time</h2>
          <div className="text-center text-red-600">
            <p>Error loading data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-lg shadow-sm p-6 relative">
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CBB04] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#404B69] rounded-full blur-3xl"></div>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exposure Over Time</h2>
          <div className="text-center text-gray-600">
            <p>No exposure data available for this chemical across all tests.</p>
          </div>
        </div>
      </div>
    );
  }

  return <ChartComponent data={data} />;
}

// Helper function for formatting values
function formatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

function generateInterpretation(points: LongitudinalDataPoint[]): string {
  const detectedPoints = points.filter(p => p.detected);
  const totalPoints = points.length;
  
  if (detectedPoints.length === 0) {
    return "This chemical has never been detected in your tests. This suggests minimal or no exposure to this substance. Continue avoiding potential sources to maintain this low exposure level.";
  }
  
  if (detectedPoints.length === totalPoints) {
    const values = detectedPoints.map(p => p.value);
    const trend = calculateTrend(values);
    const peakValue = Math.max(...values);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    if (trend > 0.1) {
      return `Consistent detection with increasing exposure trend. Peak exposure: ${formatValue(peakValue)}. Consider reviewing recent lifestyle changes, dietary habits, or environmental factors that might be contributing to this upward trend. Consult with a healthcare provider about potential health implications.`;
    } else if (trend < -0.1) {
      return `Consistent detection with decreasing exposure trend. Peak exposure: ${formatValue(peakValue)}. Your efforts to reduce exposure appear to be working. Continue current practices and consider additional measures to further minimize exposure.`;
    } else {
      return `Consistent detection with stable exposure levels. Average exposure: ${formatValue(avgValue)}. While exposure is consistent, consider identifying and reducing sources to lower your overall exposure. Regular monitoring is recommended.`;
    }
  }
  
  // Mixed detection pattern
  const lastDetected = detectedPoints[detectedPoints.length - 1];
  const hasRecentDetection = lastDetected && points.indexOf(lastDetected) >= totalPoints - 2;
  
  if (hasRecentDetection) {
    return `Intermittent detection pattern with recent exposure. This suggests variable exposure sources or seasonal patterns. Identify potential sources during high-exposure periods and implement consistent avoidance strategies. Consider tracking activities or environmental factors during detection periods.`;
  } else {
    return `Intermittent detection with no recent exposure. This suggests you may have successfully reduced exposure sources or changed behaviors. Continue current practices and maintain awareness of potential sources to prevent re-exposure.`;
  }
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;
  
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope / (sumY / n); // Normalize by average value
}

interface TooltipPayload {
  payload: {
    fullDate: string;
    value: number;
    detected: boolean;
    percentile?: number;
    rangeLow?: number;
    rangeHigh?: number;
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function ChartComponent({ data }: { data: LongitudinalResponse }) {
  const { data: points } = data;
  const [clickedPercentile, setClickedPercentile] = useState<{ percentile: number; value: number; x: number; y: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Format data for Recharts
  const chartData = points.map((point, index) => {
    const cleanDate = point.date.replace(/\r/g, '').trim();
    const date = new Date(cleanDate);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Calculate 25th and 75th percentiles from rangeLow (0th percentile) and rangeHigh (100th percentile)
    const rangeLow = point.rangeLow != null && !isNaN(point.rangeLow) && point.rangeLow >= 0 ? point.rangeLow : null;
    const rangeHigh = point.rangeHigh != null && !isNaN(point.rangeHigh) && point.rangeHigh > (point.rangeLow || 0) ? point.rangeHigh : null;
    
    let percentile25: number | null = null;
    let percentile75: number | null = null;
    
    if (rangeLow != null && rangeHigh != null && rangeHigh > rangeLow) {
      const range = rangeHigh - rangeLow;
      percentile25 = rangeLow + 0.25 * range;
      percentile75 = rangeLow + 0.75 * range;
    }
    
    return {
      index: index,
      date: dateStr,
      fullDate: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      value: point.detected ? point.value : null,
      detected: point.detected,
      percentile: point.percentile ? Math.round(point.percentile * 100) : null,
      rangeLow: rangeLow,
      rangeHigh: rangeHigh,
      percentile25: percentile25,
      percentile75: percentile75,
      testId: point.testId
    };
  });

  // Custom dot component for clickable percentile lines
  const PercentileDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (cx == null || cy == null || !payload || payload[dataKey] == null) {
      return null;
    }
    
    const percentile = dataKey === 'percentile75' ? 75 : 25;
    const value = payload[dataKey];
    
    const handleClick = (e: React.MouseEvent<SVGCircleElement>) => {
      e.stopPropagation();
      if (chartContainerRef.current) {
        const rect = chartContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setClickedPercentile({ percentile, value, x, y });
      }
    };
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="transparent"
        strokeWidth={0}
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
      />
    );
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clickedPercentile && chartContainerRef.current && !chartContainerRef.current.contains(event.target as Node)) {
        setClickedPercentile(null);
      }
    };

    if (clickedPercentile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [clickedPercentile]);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">{data.fullDate}</p>
          {data.detected ? (
            <>
              <p className="text-[#9CBB04]">
                <span className="text-gray-600">Value: </span>
                {formatValue(data.value)}
              </p>
              {data.percentile !== null && (
                <p className="text-[#9CBB04]">
                  <span className="text-gray-600">Percentile: </span>
                  {data.percentile}%
                </p>
              )}
            </>
          ) : (
            <p className="text-red-600">Not Detected</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-lg shadow-sm p-6 relative">
      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CBB04] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#404B69] rounded-full blur-3xl"></div>
        </div>
      </div>
      <div className="relative z-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Exposure Over Time</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Left: Chart */}
        <div ref={chartContainerRef} className="relative">
          <div className="[&_svg]:outline-none [&_svg]:focus:outline-none" tabIndex={-1}>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                  label={{ value: 'Value (ng/mL)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Percentile range lines - rendered first so they're behind the main line */}
                {/* Use dotted lines to show the 25th-75th percentile range */}
                <Line
                  type="monotone"
                  dataKey="percentile75"
                  stroke="#4169E1"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={<PercentileDot dataKey="percentile75" />}
                  activeDot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="percentile25"
                  stroke="#4169E1"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={<PercentileDot dataKey="percentile25" />}
                  activeDot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                {/* Main value area and line */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#9CBB04"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#9CBB04"
                  strokeWidth={2}
                  dot={{ fill: '#9CBB04', r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#9CBB04]" />
              <span className="text-gray-700">Your Results</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="2" className="text-[#4169E1]">
                <line x1="0" y1="1" x2="20" y2="1" stroke="#4169E1" strokeWidth="2" strokeDasharray="5 5" />
              </svg>
              <span className="text-gray-700">25th / 75th Percentile</span>
            </div>
          </div>
          
          {/* Percentile Tooltip */}
          {clickedPercentile && typeof window !== 'undefined' && chartContainerRef.current && createPortal(
            <div 
              className="fixed z-[9999] bg-black text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none"
              style={{
                left: `${clickedPercentile.x + chartContainerRef.current.getBoundingClientRect().left}px`,
                top: `${clickedPercentile.y + chartContainerRef.current.getBoundingClientRect().top}px`,
                transform: 'translate(-50%, -100%) translateY(-8px)'
              }}
            >
              <p className="font-semibold mb-1">{clickedPercentile.percentile}th Percentile</p>
              <p className="text-gray-300">{clickedPercentile.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ng/mL</p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
            </div>,
            document.body
          )}
        </div>

        {/* Right: Stats and Interpretation */}
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="text-xs font-medium text-gray-600 mb-1">Peak Exposure</div>
              <div className="text-lg font-semibold text-gray-900">
                {points.filter(p => p.detected).length > 0 ? `${formatValue(Math.max(...points.filter(p => p.detected).map(p => p.value)))} ng/mL` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="text-xs font-medium text-gray-600 mb-1">Detection Rate</div>
              <div className="text-lg font-semibold text-gray-900">
                {points.length > 0 ? Math.round((points.filter(p => p.detected).length / points.length) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Data Interpretation</h3>
            <div className="text-xs text-gray-700 leading-relaxed">
              {generateInterpretation(points)}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
