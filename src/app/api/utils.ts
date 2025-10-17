import { ChemicalData } from './csv-parser';

// Utility functions for chemical data processing

// Percentile-based color for individual chemicals
export function getPercentileColor(percentile?: number): string {
  if (!percentile || percentile <= 0.1) return 'text-green-600';  // Optimal (0-10%)
  if (percentile > 0.6) return 'text-red-600';                   // Pay Attention (>60%)
  return 'text-yellow-400';                                       // Monitor Only (10-60%)
}

// Format percentile for display (converts 0.532 to "53%")
export function formatPercentile(percentile?: number): string {
  if (!percentile || percentile === 0) return '0%';
  return `${Math.round(percentile * 100)}%`;
}

// Get status info for individual chemicals based on percentile
export function getChemicalStatusInfo(percentile?: number) {
  if (!percentile || percentile <= 0.1) {
    return {
      color: 'bg-green-600',
      text: 'Optimal',
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
  // Count chemicals by their individual classifications
  const payAttentionCount = chemicals.filter(c => (c.percentile || 0) > 0.6).length;
  const monitorOnlyCount = chemicals.filter(c => {
    const p = c.percentile || 0;
    return p > 0.1 && p <= 0.6;
  }).length;
  
  // Simple mutually exclusive logic with more Optimal-friendly thresholds
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
    // If <3 Monitor Only and no Pay Attention, category is Optimal
    return {
      color: 'bg-green-400',
      text: 'Optimal',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    };
  }
}

