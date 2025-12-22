'use client';

import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { getPercentileDistribution } from '@/app/api/utils';
import { ChemicalData } from '@/app/api/csv-parser';
import { EXPOSURE_COLORS } from '@/lib/colors';
import { useMemo, useCallback, useState, useEffect } from 'react';

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

type ClassificationType = 'Pay Attention' | 'Monitor Only' | 'Low Exposure';

const CLASSIFICATION_DESCRIPTIONS: Record<ClassificationType, string> = {
  'Pay Attention': 'Your exposure level falls in the 60th-100th percentile range, indicating higher exposure compared to the general population. Consider taking steps to reduce exposure and consult with a healthcare provider if you have concerns.',
  'Monitor Only': 'Your exposure level falls in the 30th-60th percentile range, indicating moderate exposure. Continue monitoring your exposure levels and consider ways to minimize contact with these chemicals when possible.',
  'Low Exposure': 'Your exposure level falls in the 0th-30th percentile range, indicating lower exposure compared to the general population. This is generally considered a favorable exposure level, but continue to be mindful of potential sources.'
};

export default function PercentileDistributionChart({ 
  chemicals, 
  onBarClick,
  noCard = false
}: PercentileDistributionChartProps) {
  const distribution = getPercentileDistribution(chemicals);
  
  const chartData = useMemo(() => {
    return [
      { name: 'Pay Attention', value: distribution.payAttention, color: EXPOSURE_COLORS.payAttention, filter: 'pay-attention' as const },
      { name: 'Monitor Only', value: distribution.monitorOnly, color: EXPOSURE_COLORS.monitorOnly, filter: 'monitor-only' as const },
      { name: 'Low Exposure', value: distribution.lowExposure, color: EXPOSURE_COLORS.lowExposure, filter: 'low-exposure' as const },
    ].filter(item => item.value > 0);
  }, [distribution]);

  // Find the classification with the most chemicals for default selection
  const defaultClassification = useMemo(() => {
    const maxEntry = chartData.reduce((max, current) => 
      current.value > max.value ? current : max, 
      chartData[0] || { name: 'Low Exposure' as ClassificationType }
    );
    return maxEntry.name as ClassificationType;
  }, [chartData]);

  const [selectedClassification, setSelectedClassification] = useState<ClassificationType>(defaultClassification);

  // Update selected classification when default changes
  useEffect(() => {
    setSelectedClassification(defaultClassification);
  }, [defaultClassification]);

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
    if (entry) {
      setSelectedClassification(entry.name as ClassificationType);
      if (onBarClick) {
        onBarClick(entry.filter);
      }
    }
  }, [chartData, onBarClick]);

  const total = distribution.notDetected + distribution.lowExposure + 
                distribution.monitorOnly + distribution.payAttention;

  const selectedEntry = chartData.find(entry => entry.name === selectedClassification);
  const selectedColor = selectedEntry?.color || EXPOSURE_COLORS.lowExposure;

  const content = (
    <>
      {!noCard && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Percentile Distribution
        </h3>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart on the left - takes 2 columns */}
        <div className="lg:col-span-2 [&_svg]:outline-none [&_svg]:focus:outline-none outline-none focus:outline-none" tabIndex={-1}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 50, right: 30, left: 0, bottom: -10 }}
              barCategoryGap="1%"
            >
              <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={handleBarClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{ 
                      opacity: selectedClassification === entry.name ? 1 : 0.6,
                      transition: 'opacity 0.2s'
                    }}
                  />
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

        {/* Info panel on the right - takes 1 column */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 h-full flex flex-col">
            <h4 
              className="text-xl font-bold mb-3"
              style={{ color: selectedColor }}
            >
              {selectedClassification}
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed flex-grow">
              {CLASSIFICATION_DESCRIPTIONS[selectedClassification]}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  if (total === 0) {
    return (
      <div className={noCard ? "" : "bg-white border border-gray-200 rounded-lg p-6 shadow-sm"}>
        {!noCard && (
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
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

