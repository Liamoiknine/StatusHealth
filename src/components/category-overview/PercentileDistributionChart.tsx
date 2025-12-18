'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import { getPercentileDistribution } from '@/app/api/utils';
import { ChemicalData } from '@/app/api/csv-parser';
import { EXPOSURE_COLORS } from '@/lib/colors';

interface PercentileDistributionChartProps {
  chemicals: ChemicalData[];
  onBarClick?: (range: string) => void;
  noCard?: boolean;
}

interface TooltipPayload {
  payload: {
    name: string;
    value: number;
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}


export default function PercentileDistributionChart({ 
  chemicals, 
  onBarClick,
  noCard = false
}: PercentileDistributionChartProps) {
  const distribution = getPercentileDistribution(chemicals);
  
  const chartData: Array<{
    name: string;
    value: number;
    color: string;
    gradientId: string;
    usePattern?: boolean;
  }> = [
    {
      name: 'Not Detected',
      value: distribution.notDetected,
      color: '#e5e7eb',
      gradientId: 'gradientNotDetected',
      usePattern: true
    },
    {
      name: 'Low Exposure',
      value: distribution.lowExposure,
      color: EXPOSURE_COLORS.lowExposure,
      gradientId: 'gradientLowExposure'
    },
    {
      name: 'Monitor Only',
      value: distribution.monitorOnly,
      color: EXPOSURE_COLORS.monitorOnly,
      gradientId: 'gradientMonitorOnly'
    },
    {
      name: 'Pay Attention',
      value: distribution.payAttention,
      color: EXPOSURE_COLORS.payAttention,
      gradientId: 'gradientPayAttention'
    }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">{data.name}</p>
          <p className="text-[#9CBB04]">
            <span className="text-gray-600">Count: </span>
            {data.value} chemical{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const total = distribution.notDetected + distribution.lowExposure + 
                distribution.monitorOnly + distribution.payAttention;

  const content = (
    <>
      {!noCard && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Percentile Distribution
        </h3>
      )}
      <div className="[&_svg]:outline-none [&_svg]:focus:outline-none" tabIndex={-1}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 50, left: 0, bottom: 20 }}
        >
          <defs>
            <pattern id="stripedNotDetected" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <rect width="4" height="8" fill="#e5e7eb" />
              <rect x="4" width="4" height="8" fill="#f3f4f6" />
            </pattern>
            <linearGradient id="gradientNotDetected" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#e5e7eb" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradientLowExposure" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={EXPOSURE_COLORS.lowExposure} stopOpacity={0.6} />
              <stop offset="100%" stopColor={EXPOSURE_COLORS.lowExposure} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradientMonitorOnly" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={EXPOSURE_COLORS.monitorOnly} stopOpacity={0.6} />
              <stop offset="100%" stopColor={EXPOSURE_COLORS.monitorOnly} stopOpacity={1} />
            </linearGradient>
            <linearGradient id="gradientPayAttention" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={EXPOSURE_COLORS.payAttention} stopOpacity={0.6} />
              <stop offset="100%" stopColor={EXPOSURE_COLORS.payAttention} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
          <XAxis 
            type="number" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            label={{ value: 'Count', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', textAnchor: 'middle' } }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar 
            dataKey="value" 
            radius={[0, 8, 8, 0]}
            onClick={(data: { name?: string }) => data?.name && onBarClick?.(data.name)}
            activeBar={false}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.usePattern ? 'url(#stripedNotDetected)' : `url(#${entry.gradientId})`}
                stroke={entry.color}
                strokeWidth={1.5}
              />
            ))}
            <LabelList 
              dataKey="value" 
              position="right" 
              style={{ fill: '#6b7280', fontSize: '12px', fontWeight: '500' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </>
  );

  if (total === 0) {
    return (
      <div className={noCard ? "" : "bg-white border border-gray-200 rounded-lg p-6 shadow-sm"}>
        {!noCard && (
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Percentile Distribution
          </h3>
        )}
        <p className="text-gray-600 text-center py-8">No data available</p>
      </div>
    );
  }

  if (noCard) {
    return <div>{content}</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {content}
    </div>
  );
}

