'use client';

import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChemicalData } from '@/app/api/csv-parser';
import { groupChemicalsByCategory, filterChemicalsByExposure, getCategoryStatusInfo } from '@/app/api/utils';
import { EXPOSURE_COLORS } from '@/lib/colors';

interface CategoryStackedBarChartProps {
  chemicals: ChemicalData[];
}

interface CategoryChartData {
  category: string;
  'Pay Attention': number;
  'Monitor Only': number;
  'Low Exposure': number;
  total: number;
}

type ClassificationType = 'pay-attention' | 'monitor-only' | 'low-exposure' | null;

export default function CategoryStackedBarChart({ chemicals }: CategoryStackedBarChartProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeClassification, setActiveClassification] = useState<ClassificationType>(null);
  const [animatedGap, setAnimatedGap] = useState(0);
  
  // Animate the gap value smoothly
  useEffect(() => {
    const targetGap = activeCategory ? 8 : 0;
    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startGap = animatedGap;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentGap = startGap + (targetGap - startGap) * easeOutQuart;
      
      setAnimatedGap(currentGap);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedGap(targetGap);
      }
    };
    
    requestAnimationFrame(animate);
  }, [activeCategory, animatedGap]);

  const categoryGroups = useMemo(() => groupChemicalsByCategory(chemicals), [chemicals]);

  const chartData = useMemo(() => {
    return Object.entries(categoryGroups)
      .map(([category, categoryChemicals]) => {
        // Only count detected chemicals (value > 0)
        const detectedChemicals = categoryChemicals.filter(c => c.value > 0);
        
        // If a classification is active, only show that classification's count
        let payAttention = filterChemicalsByExposure(detectedChemicals, 'pay-attention').length;
        let monitorOnly = filterChemicalsByExposure(detectedChemicals, 'monitor-only').length;
        let lowExposure = filterChemicalsByExposure(detectedChemicals, 'low-exposure').length;
        
        if (activeClassification) {
          // When filtering by classification, set other values to 0
          if (activeClassification === 'pay-attention') {
            monitorOnly = 0;
            lowExposure = 0;
          } else if (activeClassification === 'monitor-only') {
            payAttention = 0;
            lowExposure = 0;
          } else if (activeClassification === 'low-exposure') {
            payAttention = 0;
            monitorOnly = 0;
          }
        }
        
        const total = detectedChemicals.length;
        
        // Get category classification to determine label color
        const categoryStatusInfo = getCategoryStatusInfo(categoryChemicals);
        let labelColor = '#1f2937'; // default dark gray
        if (categoryStatusInfo.text === 'Pay Attention') {
          labelColor = EXPOSURE_COLORS.payAttention;
        } else if (categoryStatusInfo.text === 'Monitor Only') {
          labelColor = EXPOSURE_COLORS.monitorOnly;
        } else if (categoryStatusInfo.text === 'Low Exposure') {
          labelColor = EXPOSURE_COLORS.lowExposure;
        }

        return {
          category,
          'Pay Attention': payAttention,
          'Monitor Only': monitorOnly,
          'Low Exposure': lowExposure,
          total,
          isActive: activeCategory === category,
          labelColor
        };
      })
      .filter(item => {
        // If filtering by classification, only show categories with that classification
        if (activeClassification) {
          if (activeClassification === 'pay-attention') return item['Pay Attention'] > 0;
          if (activeClassification === 'monitor-only') return item['Monitor Only'] > 0;
          if (activeClassification === 'low-exposure') return item['Low Exposure'] > 0;
        }
        return item.total > 0; // Only show categories with detected chemicals
      })
      .sort((a, b) => b.total - a.total); // Sort by total detected count
  }, [categoryGroups, activeCategory, activeClassification]);

  // Calculate details data based on active state
  const detailsData = useMemo(() => {
    if (activeClassification) {
      // Filter by classification across all categories - only detected chemicals
      const detectedChemicals = chemicals.filter(c => c.value > 0);
      const filteredChemicals = filterChemicalsByExposure(detectedChemicals, activeClassification);
      const detectedCount = filteredChemicals.length;
      const totalCount = chemicals.length;
      const detectionRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
      
      return {
        totalChemicals: detectedCount,
        detectionRate,
        categoryName: null,
        classificationName: activeClassification === 'pay-attention' ? 'Pay Attention' : 
                          activeClassification === 'monitor-only' ? 'Monitor Only' : 'Low Exposure'
      };
    } else if (activeCategory) {
      // Filter by specific category
      const categoryChemicals = categoryGroups[activeCategory] || [];
      const detectedCount = categoryChemicals.filter(c => c.value > 0).length;
      const totalCount = categoryChemicals.length;
      const detectionRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
      
      return {
        totalChemicals: detectedCount,
        detectionRate,
        categoryName: activeCategory,
        classificationName: null
      };
    } else {
      // All data
      const detectedCount = chemicals.filter(c => c.value > 0).length;
      const totalCount = chemicals.length;
      const detectionRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
      
      return {
        totalChemicals: detectedCount,
        detectionRate,
        categoryName: null,
        classificationName: null
      };
    }
  }, [chemicals, categoryGroups, activeCategory, activeClassification]);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: CategoryChartData;
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryChartData;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-2">{data.category}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Total Detected:</span> {data.total}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: EXPOSURE_COLORS.payAttention }}></div>
              <span className="text-gray-600">
                <span className="font-medium">Pay Attention:</span> {data['Pay Attention']}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: EXPOSURE_COLORS.monitorOnly }}></div>
              <span className="text-gray-600">
                <span className="font-medium">Monitor Only:</span> {data['Monitor Only']}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: EXPOSURE_COLORS.lowExposure }}></div>
              <span className="text-gray-600">
                <span className="font-medium">Low Exposure:</span> {data['Low Exposure']}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  interface LabelProps {
    x?: number;
    y?: number;
    width?: number;
    payload?: CategoryChartData;
  }

  // Custom label component to show total above each bar
  const CustomLabel = (props: LabelProps) => {
    const { x, y, width, payload } = props;
    if (x === undefined || y === undefined || width === undefined || !payload) {
      return null;
    }
    
    const total = payload.total || 0;
    
    // Only show label if there are detected chemicals
    if (total === 0) {
      return null;
    }
    
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#1f2937"
        textAnchor="middle"
        fontSize={32}
        fontWeight="bold"
      >
        {total}
      </text>
    );
  };

  interface BarClickData {
    category?: string;
    payload?: {
      category?: string;
    };
  }

  const handleBarClick = (data: BarClickData) => {
    const categoryName = data?.category || data?.payload?.category;
    if (categoryName) {
      // Toggle category selection - if clicking the same category, deselect it
      setActiveCategory(activeCategory === categoryName ? null : categoryName);
      setActiveClassification(null); // Clear classification when selecting category
    }
  };

  const handleLegendClick = (classification: ClassificationType) => {
    // Toggle classification selection - if clicking the same classification, deselect it
    setActiveClassification(activeClassification === classification ? null : classification);
    setActiveCategory(null); // Clear category when selecting classification
  };

  interface CustomBarProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: CategoryChartData & { isActive?: boolean; labelColor?: string };
    fill?: string;
    isTopBar?: boolean;
    dataKey?: string;
    radius?: number[];
  }

  // Custom bar shape to highlight active category
  const CustomBar = (props: CustomBarProps) => {
    const { x, y, width, height, payload, fill, isTopBar, dataKey } = props;
    const isActive = payload?.isActive || false;
    const radius = props.radius || [0, 0, 0, 0];
    
    // Determine opacity based on active state
    let opacity = 0.9; // default
    if (isActive) {
      opacity = 1; // fully opaque when active
    } else if (activeCategory) {
      opacity = 0.4; // reduced opacity when another category is selected
    } else if (activeClassification) {
      opacity = 0.6; // reduced opacity when classification filter is active
    }
    
    // Add spacing between segments when bar is active by shifting segments up
    // Use animatedGap for smooth transitions
    const segmentGap = isActive ? animatedGap : 0;
    let adjustedY = y;
    // Keep height the same - we're shifting, not shrinking
    
    if (isActive && segmentGap > 0) {
      // Determine segment position: bottom (Pay Attention), middle (Monitor Only), or top (Low Exposure)
      if (dataKey === 'Pay Attention') {
        // Bottom segment: stays in place
        adjustedY = y;
      } else if (dataKey === 'Monitor Only') {
        // Middle segment: shift up by gap amount
        adjustedY = (y || 0) - segmentGap;
      } else if (dataKey === 'Low Exposure') {
        // Top segment: shift up by 2x gap (gap above middle + gap above top)
        adjustedY = (y || 0) - (segmentGap * 2);
      }
    }
    
    const total = payload?.total || 0;
    const labelColor = payload?.labelColor || '#1f2937';
    
    // Calculate transform for smooth animation
    const yOffset = (adjustedY || 0) - (y || 0);
    const transform = yOffset !== 0 ? `translate(0, ${yOffset})` : 'none';
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={radius[0]}
          transform={transform}
          style={{ 
            cursor: 'pointer',
            opacity
          }}
        />
        {/* Render label only on top bar - adjust y position to account for shifted segment */}
        {isTopBar && total > 0 && (
          <text
            x={(x || 0) + (width || 0) / 2}
            y={(y || 0) - 15}
            fill={labelColor}
            textAnchor="middle"
            fontSize={32}
            fontWeight="bold"
            transform={transform}
          >
            {total}
          </text>
        )}
      </g>
    );
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-8 mb-0 pb-0">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Detected Chemicals by Category</h2>
          <p className="text-gray-600 text-sm">Breakdown of detected chemicals by category and classification</p>
        </div>
        
        {/* Details Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm min-w-[320px] flex-shrink-0 relative z-20">
          <div className="pb-3 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-teal-600">
              {activeClassification 
                ? detailsData.classificationName 
                : activeCategory 
                ? activeCategory 
                : 'All Exposures'}
            </h2>
          </div>
          <div className="space-y-4 pt-3">
            <div>
              <div className="text-4xl font-bold text-gray-900">{detailsData.totalChemicals}</div>
              <div className="text-base text-gray-600 mt-1">chemicals detected</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{detailsData.detectionRate}% detection rate</div>
              <div className="text-sm text-teal-600 font-medium mt-1">↓ 18% below average</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg -mt-50">
        <div className="[&_svg]:outline-none [&_svg]:focus:outline-none" tabIndex={-1} style={{ pointerEvents: 'auto' }}>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chartData}
              margin={{ top: 60, right: 30, left: 0, bottom: 60 }}
              barCategoryGap="1%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="category" 
                axisLine={false}
                tickLine={false}
                tick={(props: { x?: number; y?: number; payload?: { value: string } }) => {
                  const { x, y, payload } = props;
                  const words = payload?.value.split(' ') || [];
                  const maxWidth = 100; // Maximum width before wrapping
                  
                  // Simple word wrapping - split into lines
                  const lines: string[] = [];
                  let currentLine = '';
                  
                  words.forEach((word: string) => {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    if (testLine.length * 6 <= maxWidth) { // Rough estimate: 6px per character
                      currentLine = testLine;
                    } else {
                      if (currentLine) lines.push(currentLine);
                      currentLine = word;
                    }
                  });
                  if (currentLine) lines.push(currentLine);
                  
                  return (
                    <g transform={`translate(${x},${y})`}>
                      {lines.map((line, index) => (
                        <text
                          key={index}
                          x={0}
                          y={index * 16 + 12}
                          textAnchor="middle"
                          fill="#6b7280"
                          fontSize={16}
                          fontWeight={900}
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  );
                }}
                height={80}
              />
              
              {/* Stacked bars - order matters for stacking */}
              <Bar 
                dataKey="Pay Attention" 
                stackId="a" 
                fill={EXPOSURE_COLORS.payAttention}
                onClick={handleBarClick}
                shape={<CustomBar radius={[0, 0, 0, 0]} isTopBar={false} dataKey="Pay Attention" />}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-in-out"
              />
              <Bar 
                dataKey="Monitor Only" 
                stackId="a" 
                fill={EXPOSURE_COLORS.monitorOnly}
                onClick={handleBarClick}
                shape={<CustomBar radius={[0, 0, 0, 0]} isTopBar={false} dataKey="Monitor Only" />}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-in-out"
              />
              <Bar 
                dataKey="Low Exposure" 
                stackId="a" 
                fill={EXPOSURE_COLORS.lowExposure}
                onClick={handleBarClick}
                shape={<CustomBar radius={[4, 4, 0, 0]} isTopBar={true} dataKey="Low Exposure" />}
                isAnimationActive={true}
                animationDuration={600}
                animationEasing="ease-in-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-0 border-t border-gray-200 -mt-18 relative z-10">
          <button
            onClick={() => handleLegendClick('pay-attention')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all relative z-20 ${
              activeClassification === 'pay-attention'
                ? 'bg-teal-50 border-2 border-teal-600'
                : 'hover:bg-gray-50'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              className="w-4 h-4 rounded" 
              style={{ 
                backgroundColor: EXPOSURE_COLORS.payAttention,
                opacity: activeClassification === 'pay-attention' ? 1 : activeClassification ? 0.4 : 1
              }}
            ></div>
            <span className={`text-sm ${
              activeClassification === 'pay-attention' ? 'text-teal-700 font-semibold' : 'text-gray-700'
            }`}>
              Pay Attention
            </span>
          </button>
          <button
            onClick={() => handleLegendClick('monitor-only')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all relative z-20 ${
              activeClassification === 'monitor-only'
                ? 'bg-teal-50 border-2 border-teal-600'
                : 'hover:bg-gray-50'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              className="w-4 h-4 rounded" 
              style={{ 
                backgroundColor: EXPOSURE_COLORS.monitorOnly,
                opacity: activeClassification === 'monitor-only' ? 1 : activeClassification ? 0.4 : 1
              }}
            ></div>
            <span className={`text-sm ${
              activeClassification === 'monitor-only' ? 'text-teal-700 font-semibold' : 'text-gray-700'
            }`}>
              Monitor Only
            </span>
          </button>
          <button
            onClick={() => handleLegendClick('low-exposure')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all relative z-20 ${
              activeClassification === 'low-exposure'
                ? 'bg-teal-50 border-2 border-teal-600'
                : 'hover:bg-gray-50'
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              className="w-4 h-4 rounded" 
              style={{ 
                backgroundColor: EXPOSURE_COLORS.lowExposure,
                opacity: activeClassification === 'low-exposure' ? 1 : activeClassification ? 0.4 : 1
              }}
            ></div>
            <span className={`text-sm ${
              activeClassification === 'low-exposure' ? 'text-teal-700 font-semibold' : 'text-gray-700'
            }`}>
              Low Exposure
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

