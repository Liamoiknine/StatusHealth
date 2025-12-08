'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChemicalData } from '@/app/api/csv-parser';
import { groupChemicalsByCategory, getCategoryStatusInfo } from '@/app/api/utils';
import { EXPOSURE_COLORS } from '@/lib/colors';
import { useRouter } from 'next/navigation';

interface CategoryComparisonChartProps {
  chemicals: ChemicalData[];
}

interface CategoryData {
  category: string;
  detectedCount: number;
  totalCount: number;
  detectionRate: number;
  avgPercentile: number;
  payAttentionCount: number;
  classification: 'Pay Attention' | 'Monitor Only' | 'Low Exposure';
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryData & { name: string; 'Detection Rate (%)': number; avgPercentileLine: number };
  }>;
}

export default function CategoryComparisonChart({ chemicals }: CategoryComparisonChartProps) {
  const router = useRouter();
  const categoryGroups = groupChemicalsByCategory(chemicals);
  
  const categoryData: CategoryData[] = Object.entries(categoryGroups).map(([category, categoryChemicals]) => {
    const detected = categoryChemicals.filter(c => c.value > 0);
    const detectionRate = categoryChemicals.length > 0 
      ? Math.round((detected.length / categoryChemicals.length) * 100) 
      : 0;
    const avgPercentile = detected.length > 0
      ? detected.reduce((sum, c) => sum + (c.percentile || 0), 0) / detected.length
      : 0;
    const payAttentionCount = detected.filter(c => (c.percentile || 0) > 0.6).length;
    const statusInfo = getCategoryStatusInfo(categoryChemicals);
    
    return {
      category,
      detectedCount: detected.length,
      totalCount: categoryChemicals.length,
      detectionRate,
      avgPercentile: Math.round(avgPercentile * 100),
      payAttentionCount,
      classification: statusInfo.text as 'Pay Attention' | 'Monitor Only' | 'Low Exposure'
    };
  }).sort((a, b) => b.detectionRate - a.detectionRate);

  const chartData = categoryData.map(item => ({
    name: item.category,
    'Detection Rate (%)': item.detectionRate,
    avgPercentileLine: item.avgPercentile, // For the subtle indicator line
    // Store full data for tooltip
    ...item
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const categoryInfo = categoryData.find(c => c.category === data.name);
      
      if (!categoryInfo) return null;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">{categoryInfo.category}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Detected:</span> {categoryInfo.detectedCount}/{categoryInfo.totalCount}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Detection Rate:</span> {categoryInfo.detectionRate}%
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Avg Percentile:</span> {categoryInfo.avgPercentile}%
            </p>
            <p className="text-red-600">
              <span className="font-medium">Pay Attention:</span> {categoryInfo.payAttentionCount} chemical{categoryInfo.payAttentionCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  interface BarClickData {
    name?: string;
    payload?: {
      name?: string;
    };
  }

  const handleBarClick = (data: BarClickData) => {
    const categoryName = data?.name || data?.payload?.name;
    if (categoryName) {
      router.push(`/categories?category=${encodeURIComponent(categoryName)}`);
    }
  };

  // Get color based on classification
  const getBarColor = (classification: string): string => {
    switch (classification) {
      case 'Pay Attention':
        return EXPOSURE_COLORS.payAttention;
      case 'Monitor Only':
        return EXPOSURE_COLORS.monitorOnly;
      case 'Low Exposure':
        return EXPOSURE_COLORS.lowExposure;
      default:
        return EXPOSURE_COLORS.lowExposure;
    }
  };

  interface CustomBarProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: CategoryData & { name: string; 'Detection Rate (%)': number; avgPercentileLine: number };
  }

  // Custom shape to show average percentile as a subtle line within the bar
  const CustomBar = (props: CustomBarProps) => {
    const { x, y, width, height, payload } = props;
    
    if (!payload || x === undefined || y === undefined || width === undefined || height === undefined) {
      return null;
    }
    
    const avgPercentile = payload.avgPercentileLine || 0;
    const categoryInfo = categoryData.find(c => c.category === payload.name);
    const barColor = categoryInfo ? getBarColor(categoryInfo.classification) : EXPOSURE_COLORS.lowExposure;
    
    // Calculate the position of the percentile line within the bar
    // The line position represents the percentile (0-100%) from the bottom
    const linePosition = (avgPercentile / 100) * height;
    
    return (
      <g>
        {/* Main bar */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={barColor}
          rx={4}
          onClick={() => handleBarClick({ name: payload.name })}
          style={{ cursor: 'pointer' }}
        />
        {/* Subtle indicator line for average percentile */}
        {avgPercentile > 0 && linePosition > 0 && (
          <line
            x1={x}
            y1={y + height - linePosition}
            x2={x + width}
            y2={y + height - linePosition}
            stroke="#1a2540"
            strokeWidth={2}
            strokeOpacity={0.3}
            strokeDasharray="4 4"
          />
        )}
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Exposures by Category</h2>
      </div>
      
      <div className="[&_svg]:outline-none [&_svg]:focus:outline-none" tabIndex={-1}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              label={{ value: 'Detection Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20, 184, 166, 0.1)' }} />
            <Bar 
              dataKey="Detection Rate (%)" 
              shape={<CustomBar />}
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

