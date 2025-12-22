'use client';

import { getSourceDistribution } from '@/app/api/utils';
import { ChemicalData } from '@/app/api/csv-parser';

interface ExposureSourceAnalysisProps {
  chemicals: ChemicalData[];
  onSourceClick?: (source: string) => void;
  noCard?: boolean;
}

const COLORS = [
  { bg: 'bg-gradient-to-br from-[#9CBB04] to-[#8AA803]', solid: '#9CBB04', text: 'text-[#9CBB04]', border: 'border-[#9CBB04]', light: 'bg-[#9CBB04]/10' },
  { bg: 'bg-gradient-to-br from-[#404B69] to-[#2d3447]', solid: '#404B69', text: 'text-[#404B69]', border: 'border-[#404B69]', light: 'bg-[#404B69]/10' },
  { bg: 'bg-gradient-to-br from-[#14b8a6] to-[#0d9488]', solid: '#14b8a6', text: 'text-[#14b8a6]', border: 'border-[#14b8a6]', light: 'bg-[#14b8a6]/10' },
];

const RANK_LABELS = ['1st', '2nd', '3rd'];

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

  if (sourceDist.length === 0) {
    return (
      <div className={noCard ? "" : "bg-white border border-gray-200 rounded-lg p-6 shadow-sm"}>
        {!noCard && (
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Exposure Sources
          </h3>
        )}
        <p className="text-gray-600 text-center py-8">No source data available</p>
      </div>
    );
  }

  // Get top 2-3 sources (prioritize 3 if there are enough, otherwise show what's available)
  const topSources = sourceDist
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.min(3, sourceDist.length));
  
  // Calculate total count for percentage display
  const totalCount = sourceDist.reduce((sum, item) => sum + item.count, 0);

  const content = (
    <>
      {!noCard && (
        <div className="mb-4 pl-4 border-l-4" style={{ borderColor: '#404B69' }}>
          <h3 className="text-2xl font-semibold text-gray-900 mb-1 text-left">
            Top Exposure Sources
          </h3>
          <p className="text-sm text-gray-600 text-left">
            Your chemicals within this category can be traced back to specific sources. These are the primary sources contributing to your exposure.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topSources.map((item, index) => {
          const explanation = getSourceExplanation(item.source, chemicals);
          const colorScheme = COLORS[index % COLORS.length];
          const percentage = totalCount > 0 ? parseFloat(((item.count / totalCount) * 100).toFixed(1)) : 0;
          const rankLabel = RANK_LABELS[index] || `${index + 1}th`;
          
          return (
            <div 
              key={item.source}
              className="group relative bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#9CBB04]/50 hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full"
              onClick={() => onSourceClick?.(item.source)}
              style={{ cursor: onSourceClick ? 'pointer' : 'default' }}
            >
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${colorScheme.bg}`}></div>
              
              {/* Rank badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${colorScheme.bg} shadow-sm`}>
                  {rankLabel}
                </div>
                <div className={`text-2xl font-bold ${colorScheme.text}`}>
                  {percentage}%
                </div>
              </div>
              
              {/* Source name */}
              <h5 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#404B69] transition-colors">
                {item.source}
              </h5>
              
              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-grow">
                {explanation}
              </p>
              
              {/* Stats footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: colorScheme.solid }}
                  ></div>
                  <span className="text-xs font-medium text-gray-500">
                    {item.count} chemical{item.count !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="flex-1 max-w-[100px] h-1.5 bg-gray-200 rounded-full overflow-hidden ml-3">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: colorScheme.solid
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (noCard) {
    return <div>{content}</div>;
  }

  return (
    <div>
      {content}
    </div>
  );
}

