'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getSourceDistribution } from '@/app/api/utils';
import { ChemicalData } from '@/app/api/csv-parser';
import { useState, useRef } from 'react';

interface ExposureSourceAnalysisProps {
  chemicals: ChemicalData[];
  onSourceClick?: (source: string) => void;
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

interface LabelProps {
  cx: number;
  cy: number;
  midAngle?: number;
  innerRadius: number;
  outerRadius: number;
  percent?: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  '#14b8a6', // teal - site accent
  '#06b6d4', // cyan
  '#22d3ee', // light cyan
  '#0891b2', // sky blue
  '#0ea5e9', // bright blue
  '#3b82f6', // blue
  '#2563eb', // deep blue
  '#1e40af', // darker blue
  '#10b981', // emerald
  '#059669', // darker emerald
  '#34d399', // light green
  '#22c55e', // green
];

// Generate explanation for a source based on the chemicals that have it
function getSourceExplanation(source: string, chemicals: ChemicalData[]): string {
  const sourceChemicals = chemicals.filter(c => c.primarySource === source);
  const chemicalNames = sourceChemicals.map(c => c.compound.toLowerCase());
  
  // Common source patterns and their explanations
  const sourceLower = source.toLowerCase();
  
  if (sourceLower.includes('food') || sourceLower.includes('packaging') || sourceLower.includes('container')) {
    return 'Chemicals from food packaging, containers, and food contact materials. These can migrate into food and beverages, leading to ingestion exposure.';
  }
  
  if (sourceLower.includes('cosmetic') || sourceLower.includes('personal care') || sourceLower.includes('beauty')) {
    return 'Chemicals found in personal care products, cosmetics, and beauty items. Exposure occurs through dermal contact and potential absorption through the skin.';
  }
  
  if (sourceLower.includes('household') || sourceLower.includes('cleaning') || sourceLower.includes('detergent')) {
    return 'Chemicals from household cleaning products, detergents, and home maintenance items. Exposure can occur through dermal contact, inhalation, or residue on surfaces.';
  }
  
  if (sourceLower.includes('industrial') || sourceLower.includes('manufacturing')) {
    return 'Chemicals from industrial processes, manufacturing, or workplace environments. Exposure may occur through occupational contact or environmental contamination.';
  }
  
  if (sourceLower.includes('pesticide') || sourceLower.includes('herbicide') || sourceLower.includes('agricultural')) {
    return 'Chemicals from agricultural applications, pesticides, and herbicides. Exposure can occur through food residues, environmental contamination, or direct contact.';
  }
  
  if (sourceLower.includes('plastic') || sourceLower.includes('pvc') || sourceLower.includes('polymer')) {
    return 'Chemicals from plastic materials, PVC products, and polymer-based items. These can leach out over time, especially with heat or wear, leading to exposure.';
  }
  
  if (sourceLower.includes('furniture') || sourceLower.includes('upholstery') || sourceLower.includes('foam')) {
    return 'Chemicals from furniture, upholstery, and foam products. These can off-gas into indoor air or be released through wear, contributing to inhalation and dermal exposure.';
  }
  
  if (sourceLower.includes('textile') || sourceLower.includes('fabric') || sourceLower.includes('clothing')) {
    return 'Chemicals from textiles, fabrics, and clothing. Exposure occurs through dermal contact and can be enhanced by heat, moisture, or friction.';
  }
  
  if (sourceLower.includes('air') || sourceLower.includes('indoor') || sourceLower.includes('dust')) {
    return 'Chemicals present in indoor air or dust. These accumulate from various sources and can be inhaled or ingested through dust particles.';
  }
  
  if (sourceLower.includes('water') || sourceLower.includes('drinking')) {
    return 'Chemicals found in water sources, including drinking water. Exposure occurs through ingestion and can come from environmental contamination or treatment processes.';
  }
  
  // Default explanation based on chemical types
  const hasPhthalates = chemicalNames.some(name => name.includes('phthalate'));
  const hasPFAS = chemicalNames.some(name => name.includes('pfas') || name.includes('perfluoro') || name.includes('pfoa') || name.includes('pfos'));
  const hasPesticides = chemicalNames.some(name => name.includes('pesticide') || name.includes('herbicide') || name.includes('insecticide'));
  
  if (hasPhthalates) {
    return 'Chemicals used as plasticizers and additives in various consumer products. Common in flexible plastics, personal care items, and household goods.';
  }
  
  if (hasPFAS) {
    return 'Per- and polyfluoroalkyl substances (PFAS) used for water and stain resistance. Found in many consumer products and can persist in the environment.';
  }
  
  if (hasPesticides) {
    return 'Agricultural or residential pesticides and herbicides. Exposure can occur through food residues, environmental contamination, or direct application.';
  }
  
  // Generic fallback
  return `Chemicals from ${source.toLowerCase()} sources. Exposure pathways may include ingestion, dermal contact, or inhalation depending on the specific chemicals involved.`;
}

export default function ExposureSourceAnalysis({ 
  chemicals, 
  onSourceClick,
  noCard = false
}: ExposureSourceAnalysisProps) {
  const sourceDist = getSourceDistribution(chemicals);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sourceRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  if (sourceDist.length === 0) {
    return (
      <div className={noCard ? "" : "bg-white border border-gray-200 rounded-lg p-6 shadow-sm"}>
        {!noCard && (
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#1a2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Exposure Sources
          </h3>
        )}
        <p className="text-gray-600 text-center py-8">No source data available</p>
      </div>
    );
  }


  const pieData = sourceDist.map((item, index) => ({
    name: item.source,
    value: item.count,
    color: COLORS[index % COLORS.length]
  }));

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-gray-900 font-semibold mb-1">{data.name}</p>
          <p className="text-teal-600">
            <span className="text-gray-600">Count: </span>
            {data.value} chemical{data.value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) => {
    if (!percent || percent < 0.05 || !midAngle) return null; // Don't show labels for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const handleSliceClick = (data: PieData) => {
    if (data?.name) {
      // Call the optional onSourceClick callback
      onSourceClick?.(data.name);
      
      // Scroll to the corresponding source description
      const element = sourceRefs.current.get(data.name);
      if (element) {
        const container = element.closest('.overflow-y-auto');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const scrollTop = container.scrollTop;
          const relativeTop = elementRect.top - containerRect.top + scrollTop;
          
          container.scrollTo({
            top: relativeTop - 10, // 10px offset from top
            behavior: 'smooth'
          });
        }
      }
    }
  };

  const content = (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .recharts-wrapper *:focus {
            outline: none !important;
          }
          .recharts-wrapper *:focus-visible {
            outline: none !important;
          }
        `
      }} />
      {!noCard && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#1a2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Exposure Sources
        </h3>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart on the left */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-sm">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={handleSliceClick}
                  style={{ cursor: 'pointer' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      opacity={activeIndex === index ? 1 : activeIndex === null ? 1 : 0.5}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source explanations on the right */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Source Descriptions</h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {sourceDist.slice(0, 8).map((item, index) => {
              const explanation = getSourceExplanation(item.source, chemicals);
              const color = COLORS[index % COLORS.length];
              return (
                <div 
                  key={item.source}
                  ref={(el) => {
                    if (el) {
                      sourceRefs.current.set(item.source, el);
                    } else {
                      sourceRefs.current.delete(item.source);
                    }
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors scroll-mt-2"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                        {item.source}
                      </h5>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {explanation}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {item.count} chemical{item.count !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  if (noCard) {
    return <div>{content}</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {content}
    </div>
  );
}

