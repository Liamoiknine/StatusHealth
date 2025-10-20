import { ChemicalData } from './csv-parser';

// Utility functions for chemical data processing

// Percentile-based color for individual chemicals
export function getPercentileColor(percentile?: number, value?: number): string {
  if (value === 0) return 'text-gray-500';                       // Not Detected
  if (!percentile || percentile <= 0.3) return 'text-green-600'; // Low Exposure (0-30%)
  if (percentile > 0.6) return 'text-red-600';                   // Pay Attention (>60%)
  return 'text-yellow-400';                                       // Monitor Only (30-60%)
}

// Format percentile for display (converts 0.532 to "53%")
export function formatPercentile(percentile?: number, value?: number): string {
  if (value === 0) return 'N/D';  // Not Detected
  if (!percentile || percentile === 0) return '0%';
  return `${Math.round(percentile * 100)}%`;
}

// Get status info for individual chemicals based on percentile
export function getChemicalStatusInfo(percentile?: number, value?: number) {
  if (value === 0) {
    return {
      color: 'bg-gray-400',
      text: 'Not Detected',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    };
  } else if (!percentile || percentile <= 0.3) {
    return {
      color: 'bg-green-600',
      text: 'Low Exposure',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    };
  } else if (percentile > 0.6) {
    return {
      color: 'bg-red-500',
      text: 'Pay Attention',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    };
  } else {
    return {
      color: 'bg-yellow-400',
      text: 'Monitor Only',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    };
  }
}

export function groupChemicalsByCategory(chemicals: ChemicalData[]) {
  return chemicals.reduce((groups, chemical) => {
    const category = chemical.exposureCategory;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(chemical);
    return groups;
  }, {} as Record<string, ChemicalData[]>);
}

export function getCategoryStats(categoryGroups: Record<string, ChemicalData[]>) {
  return Object.entries(categoryGroups)
    .map(([category, chemicals]) => {
      const detectedCount = chemicals.filter(c => c.value > 0).length;
      const totalCount = chemicals.length;
      
      return {
        category,
        detectedCount,
        totalCount,
        chemicals: chemicals.sort((a, b) => {
          // Sort by percentile (highest first), treating undefined as 0
          const aPercentile = a.percentile || 0;
          const bPercentile = b.percentile || 0;
          return bPercentile - aPercentile;
        })
      };
    })
    .sort((a, b) => b.detectedCount - a.detectedCount);
}

// SIMPLIFIED: Category classification based on individual chemical classifications
export function getCategoryStatusInfo(chemicals: ChemicalData[]) {
  // Count chemicals by their individual classifications (only detected chemicals)
  const detectedChemicals = chemicals.filter(c => c.value > 0);
  const payAttentionCount = detectedChemicals.filter(c => (c.percentile || 0) > 0.6).length;
  const monitorOnlyCount = detectedChemicals.filter(c => {
    const p = c.percentile || 0;
    return p > 0.3 && p <= 0.6;
  }).length;
  
  // Simple mutually exclusive logic with more Low Exposure-friendly thresholds
  if (payAttentionCount >= 3) {
    // If 3+ chemicals are Pay Attention, category is Pay Attention
    return {
      color: 'bg-red-500',
      text: 'Pay Attention',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    };
  } else if (monitorOnlyCount >= 3 || payAttentionCount >= 1) {
    // If 3+ Monitor Only OR 1+ Pay Attention, category is Monitor Only
    return {
      color: 'bg-yellow-400',
      text: 'Monitor Only',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    };
  } else {
    // If <3 Monitor Only and no Pay Attention, category is Low Exposure
    return {
      color: 'bg-green-400',
      text: 'Low Exposure',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    };
  }
}

