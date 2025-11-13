'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import { getPercentileDistribution } from '@/app/api/utils';
import { ChemicalData } from '@/app/api/csv-parser';

interface PercentileDistributionChartProps {
  chemicals: ChemicalData[];
  onBarClick?: (range: string) => void;
}

export default function PercentileDistributionChart({ 
  chemicals, 
  onBarClick 
}: PercentileDistributionChartProps) {
  const distribution = getPercentileDistribution(chemicals);
  
  const chartData = [
    {
      name: 'Not Detected',
      value: distribution.notDetected,
      color: '#6b7280',
      gradientId: 'gradientNotDetected'
    },
    {
      name: 'Low Exposure',
      value: distribution.lowExposure,
      color: '#16a34a',
      gradientId: 'gradientLowExposure'
    },
    {
      name: 'Monitor Only',
      value: distribution.monitorOnly,
      color: '#eab308',
      gradientId: 'gradientMonitorOnly'
    },
    {
      name: 'Pay Attention',
      value: distribution.payAttention,
      color: '#dc2626',
      gradientId: 'gradientPayAttention'
    }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f1729] border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{data.name}</p>
          <p className="text-teal-400">
            <span className="text-gray-300">Count: </span>
            {data.value} chemical{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const total = distribution.notDetected + distribution.lowExposure + 
                distribution.monitorOnly + distribution.payAttention;

  if (total === 0) {
    return (
      <div className="bg-[#1a2540] border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Percentile Distribution
        </h3>
        <p className="text-gray-400 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2540] border border-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Percentile Distribution
      </h3>
      <div className="[&_svg]:outline-none [&_svg]:focus:outline-none" tabIndex={-1}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 50, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="gradientNotDetected" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6b7280" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#6b7280" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradientLowExposure" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradientMonitorOnly" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eab308" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#eab308" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradientPayAttention" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#dc2626" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fill: '#9ca3af', textAnchor: 'middle' } }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar 
            dataKey="value" 
            radius={[0, 8, 8, 0]}
            onClick={(data: any) => data?.name && onBarClick?.(data.name)}
            activeBar={false}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#${entry.gradientId})`}
                stroke={entry.color}
                strokeWidth={1.5}
              />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              style={{ fill: '#9ca3af', fontSize: '12px', fontWeight: '500' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

