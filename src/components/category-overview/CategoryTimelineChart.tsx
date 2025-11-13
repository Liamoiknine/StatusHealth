'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CategoryLongitudinalResponse } from '@/app/api/chemicals/longitudinal/category/route';

interface CategoryTimelineChartProps {
  categoryName: string;
}

export default function CategoryTimelineChart({ categoryName }: CategoryTimelineChartProps) {
  const [data, setData] = useState<CategoryLongitudinalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'percentile' | 'detectionRate'>('percentile');

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

  if (loading) {
    return (
      <div className="bg-[#1a2540] border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
        </h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a2540] border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
        </h3>
        <div className="text-center text-red-400 py-8">
          <p>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.hasData || data.data.length === 0) {
    return (
      <div className="bg-[#1a2540] border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
        </h3>
        <div className="text-center text-gray-400 py-8">
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f1729] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{data.fullDate}</p>
          {metric === 'percentile' && data.averagePercentile !== null && (
            <p className="text-teal-400">
              <span className="text-gray-300">Avg Percentile: </span>
              {data.averagePercentile}%
            </p>
          )}
          {metric === 'detectionRate' && (
            <p className="text-teal-400">
              <span className="text-gray-300">Detection Rate: </span>
              {data.detectionRate}%
            </p>
          )}
          <p className="text-gray-400 text-xs mt-1">
            {data.totalDetected} of {data.totalChemicals} detected
          </p>
        </div>
      );
    }
    return null;
  };

  const hasPercentileData = chartData.some(d => d.averagePercentile !== null);

  return (
    <div className="bg-[#1a2540] border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Category Trends
        </h3>
        {hasPercentileData && (
          <div className="flex gap-2">
            <button
              onClick={() => setMetric('percentile')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                metric === 'percentile'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#0f1729] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              Percentile
            </button>
            <button
              onClick={() => setMetric('detectionRate')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                metric === 'detectionRate'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#0f1729] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              Detection Rate
            </button>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {metric === 'percentile' && hasPercentileData ? (
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPercentile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              label={{ value: 'Percentile (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="averagePercentile"
              stroke="#14b8a6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPercentile)"
            />
            <Line
              type="monotone"
              dataKey="averagePercentile"
              stroke="#14b8a6"
              strokeWidth={2}
              dot={{ fill: '#14b8a6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        ) : (
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDetection" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
              label={{ value: 'Detection Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
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

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${metric === 'percentile' && hasPercentileData ? 'bg-teal-400' : 'bg-blue-500'}`} />
          <span className="text-gray-300">
            {metric === 'percentile' && hasPercentileData ? 'Average Percentile' : 'Detection Rate'}
          </span>
        </div>
      </div>
    </div>
  );
}

