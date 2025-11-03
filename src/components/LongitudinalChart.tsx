'use client';

import { useState, useEffect } from 'react';
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
      <div className="bg-[#1a2540] border border-gray-700 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Exposure Over Time</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a2540] border border-gray-700 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Exposure Over Time</h2>
        <div className="text-center text-red-400">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="bg-[#1a2540] border border-gray-700 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Exposure Over Time</h2>
        <div className="text-center text-gray-400">
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

function ChartComponent({ data }: { data: LongitudinalResponse }) {
  const { data: points } = data;
  
  // Chart dimensions
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max values for scaling (including percentile ranges)
  const values = points.map(p => p.value).filter(v => v > 0);
  const rangeLows = points.map(p => p.rangeLow).filter((v): v is number => v !== undefined);
  const rangeHighs = points.map(p => p.rangeHigh).filter((v): v is number => v !== undefined);
  
  // Combine all values to determine the full scale
  const allValues = [...values, ...rangeLows, ...rangeHighs];
  
  let maxValue = 1;
  let minValue = 0;
  
  if (allValues.length > 0) {
    maxValue = Math.max(...allValues);
    minValue = Math.min(...allValues);
    
    // Add some padding to the scale (10% on each side) for better visibility
    const range = maxValue - minValue;
    const padding = range * 0.1;
    maxValue = maxValue + padding;
    minValue = Math.max(0, minValue - padding); // Don't go below 0
  }

  // Parse dates and create scales
  const dates = points.map(p => {
    const cleanDate = p.date.replace(/\r/g, '').trim();
    return new Date(cleanDate);
  }).filter(d => !isNaN(d.getTime())); // Filter out invalid dates
  
  const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

  // Helper functions for positioning
  const getX = (date: Date) => {
    const timeRange = maxDate.getTime() - minDate.getTime();
    const timePosition = date.getTime() - minDate.getTime();
    return padding.left + (timeRange > 0 ? (timePosition / timeRange) * chartWidth : chartWidth / 2);
  };

  const getY = (value: number) => {
    const valueRange = maxValue - minValue;
    const normalizedValue = valueRange > 0 ? (value - minValue) / valueRange : 0.5;
    return padding.top + chartHeight - (normalizedValue * chartHeight);
  };

  // Create path for the line
  const createPath = () => {
    const detectedPoints = points.filter(p => p.detected);
    if (detectedPoints.length === 0) return '';

    let path = '';
    detectedPoints.forEach((point, index) => {
      const x = getX(new Date(point.date.replace(/\r/g, '')));
      const y = getY(point.value);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    return path;
  };

  // Create path for the percentile range shaded area
  const createRangePath = () => {
    const pointsWithRange = points.filter(p => p.rangeLow !== undefined && p.rangeHigh !== undefined);
    if (pointsWithRange.length === 0) return '';

    let path = '';
    
    // Draw top line (rangeHigh) from left to right
    pointsWithRange.forEach((point, index) => {
      const x = getX(new Date(point.date.replace(/\r/g, '')));
      const y = getY(point.rangeHigh!);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    // Draw bottom line (rangeLow) from right to left
    for (let i = pointsWithRange.length - 1; i >= 0; i--) {
      const point = pointsWithRange[i];
      const x = getX(new Date(point.date.replace(/\r/g, '')));
      const y = getY(point.rangeLow!);
      path += ` L ${x} ${y}`;
    }
    
    path += ' Z'; // Close the path
    return path;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-[#1a2540] border border-gray-700 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Exposure Over Time</h2>
      
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="mx-auto">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = padding.top + chartHeight - (ratio * chartHeight);
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#374151"
                strokeWidth="1"
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const value = minValue + (maxValue - minValue) * ratio;
            const y = padding.top + chartHeight - (ratio * chartHeight);
            return (
              <text
                key={ratio}
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-300"
              >
                {formatValue(value)}
              </text>
            );
          })}

          {/* X-axis labels */}
          {points.map((point, index) => {
            const x = getX(new Date(point.date.replace(/\r/g, '')));
            return (
              <text
                key={index}
                x={x}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                className="text-xs fill-gray-300"
              >
                {formatDate(new Date(point.date.replace(/\r/g, '')))}
              </text>
            );
          })}

          {/* Shaded area for 25th-75th percentile range */}
          <path
            d={createRangePath()}
            fill="#5eead4"
            fillOpacity="0.3"
            stroke="none"
          />

          {/* Line chart */}
          <path
            d={createPath()}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => {
            const x = getX(new Date(point.date.replace(/\r/g, '')));
            const y = point.detected ? getY(point.value) : padding.top + chartHeight;
            
            return (
              <g key={index}>
                {/* Point */}
                <circle
                  cx={x}
                  cy={y}
                  r={point.detected ? "4" : "3"}
                  fill={point.detected ? "#14b8a6" : "#ef4444"}
                  stroke="#1a2540"
                  strokeWidth="2"
                />
                
                {/* Tooltip trigger area */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="transparent"
                  className="cursor-pointer"
                >
                  <title>
                    {formatDate(new Date(point.date.replace(/\r/g, '')))}: {point.detected ? formatValue(point.value) : 'Not detected'}
                    {point.percentile && ` (${(point.percentile * 100).toFixed(1)}th percentile)`}
                  </title>
                </circle>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="#6b7280"
            strokeWidth="2"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="#6b7280"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
          <span className="text-gray-300">Your Results</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-300">Not Detected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-3 bg-teal-400 opacity-30 rounded"></div>
          <span className="text-gray-300">25th-75th Percentile</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-[#0f1729] border border-gray-800 p-3 rounded">
          <div className="font-medium text-white">Peak Exposure</div>
          <div className="text-gray-300">
            {points.filter(p => p.detected).length > 0 ? formatValue(Math.max(...points.filter(p => p.detected).map(p => p.value))) : 'N/A'}
          </div>
        </div>
        <div className="bg-[#0f1729] border border-gray-800 p-3 rounded">
          <div className="font-medium text-white">Detection Rate</div>
          <div className="text-gray-300">
            {points.length > 0 ? Math.round((points.filter(p => p.detected).length / points.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-6 p-4 bg-[#0f1729] border border-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Data Interpretation</h3>
        <div className="text-sm text-gray-300 leading-relaxed">
          {generateInterpretation(points)}
        </div>
      </div>
    </div>
  );
}
