'use client';

import { memo, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ChemicalData } from '@/app/api/csv-parser';
import { filterChemicalsByExposure } from '@/app/api/utils';
import { EXPOSURE_COLORS } from '@/lib/colors';

interface DetectionBreakdownChartProps {
  chemicals: ChemicalData[];
  onBarClick?: (classification: 'pay-attention' | 'monitor-only' | 'low-exposure') => void;
}

const DetectionBreakdownChart = memo(function DetectionBreakdownChart({ 
  chemicals, 
  onBarClick 
}: DetectionBreakdownChartProps) {
  const chartData = useMemo(() => {
    const payAttention = filterChemicalsByExposure(chemicals, 'pay-attention').length;
    const monitorOnly = filterChemicalsByExposure(chemicals, 'monitor-only').length;
    const lowExposure = filterChemicalsByExposure(chemicals, 'low-exposure').length;

    return [
      { name: 'Pay Attention', value: payAttention, color: EXPOSURE_COLORS.payAttention, filter: 'pay-attention' as const },
      { name: 'Monitor Only', value: monitorOnly, color: EXPOSURE_COLORS.monitorOnly, filter: 'monitor-only' as const },
      { name: 'Low Exposure', value: lowExposure, color: EXPOSURE_COLORS.lowExposure, filter: 'low-exposure' as const },
    ];
  }, [chemicals]);

  interface BarClickData {
    name?: string;
    value?: number | [number, number];
    payload?: {
      name?: string;
      value?: number;
    };
  }

  const handleBarClick = useCallback((data: BarClickData) => {
    const dataValue = Array.isArray(data.value) ? data.value[0] : data.value;
    const entry = chartData.find(item => item.name === data.name || item.value === dataValue || item.name === data.payload?.name || item.value === data.payload?.value);
    if (entry && onBarClick) {
      onBarClick(entry.filter);
    }
  }, [chartData, onBarClick]);

  return (
    <div className="max-w-md">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 50, right: 30, left: 0, bottom: -10 }}
          barCategoryGap="1%"
        >
        <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={handleBarClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <LabelList 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content={(props: any) => {
              const { x, y, width, value, payload } = props;
              // Get the name from payload or find entry by value
              const entry = payload?.name 
                ? chartData.find(item => item.name === payload.name)
                : chartData.find(item => item.value === value);
              const color = entry?.color || '#000000';
              
              const xNum = typeof x === 'number' ? x : Number(x) || 0;
              const yNum = typeof y === 'number' ? y : Number(y) || 0;
              const widthNum = typeof width === 'number' ? width : Number(width) || 0;
              
              return (
                <text
                  x={xNum + widthNum / 2}
                  y={yNum - 8}
                  fill={color}
                  textAnchor="middle"
                  fontSize={32}
                  fontWeight="bold"
                >
                  {value}
                </text>
              );
            }} 
          />
        </Bar>
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
        />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
});

export default DetectionBreakdownChart;

