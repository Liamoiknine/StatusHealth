'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exposure Over Time</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exposure Over Time</h2>
        <div className="text-center text-red-600">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Exposure Over Time</h2>
        <div className="text-center text-gray-600">
          <p>No exposure data available for this chemical across all tests.</p>
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

  // Format data for Recharts
  const chartData = points.map(point => {
    const cleanDate = point.date.replace(/\r/g, '').trim();
    const date = new Date(cleanDate);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      fullDate: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      value: point.detected ? point.value : null,
      detected: point.detected,
      percentile: point.percentile ? Math.round(point.percentile * 100) : null,
      rangeLow: point.rangeLow,
      rangeHigh: point.rangeHigh,
      testId: point.testId
    };
  });

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">{data.fullDate}</p>
          {data.detected ? (
            <>
              <p className="text-teal-600">
                <span className="text-gray-600">Value: </span>
                {formatValue(data.value)}
              </p>
              {data.percentile !== null && (
                <p className="text-teal-600">
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Exposure Over Time</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Left: Chart */}
        <div>
          <div className="[&_svg]:outline-none [&_svg]:focus:outline-none" tabIndex={-1}>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
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
                {/* Percentile range shaded area - rendered first so it's behind the main line */}
                {/* Use ReferenceArea for each data point to create the shaded region between rangeLow and rangeHigh */}
                {chartData.map((entry, index) => {
                  if (entry.rangeLow != null && entry.rangeHigh != null && index < chartData.length - 1) {
                    const nextEntry = chartData[index + 1];
                    return (
                      <ReferenceArea
                        key={`range-${index}`}
                        x1={entry.date}
                        x2={nextEntry.date}
                        y1={entry.rangeLow}
                        y2={entry.rangeHigh}
                        fill="#4169E1"
                        fillOpacity={0.3}
                        stroke="none"
                      />
                    );
                  }
                  return null;
                })}
                {/* Main value area and line */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ fill: '#14b8a6', r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-gray-700">Your Results</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 rounded" style={{ backgroundColor: 'rgba(65, 105, 225, 0.3)' }} />
              <span className="text-gray-700">25th-75th Percentile</span>
            </div>
          </div>
        </div>

        {/* Right: Stats and Interpretation */}
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="text-xs font-medium text-gray-600 mb-1">Peak Exposure</div>
              <div className="text-lg font-semibold text-gray-900">
                {points.filter(p => p.detected).length > 0 ? formatValue(Math.max(...points.filter(p => p.detected).map(p => p.value))) : 'N/A'}
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
  );
}
