import { ChemicalData } from './csv-parser';
import { EXPOSURE_COLORS, EXPOSURE_COLOR_CLASSES } from '@/lib/colors';

// Utility functions for chemical data processing

export type ExposureFilterType = 'all' | 'pay-attention' | 'monitor-only' | 'low-exposure' | 'not-detected';

// Filter chemicals by exposure level
export function filterChemicalsByExposure(
  chemicals: ChemicalData[],
  filter: ExposureFilterType
): ChemicalData[] {
  return chemicals.filter(chemical => {
    const percentile = chemical.percentile || 0;
    const value = chemical.value;
    switch (filter) {
      case 'not-detected':
        return value === 0;
      case 'low-exposure':
        return value > 0 && percentile <= 0.3;
      case 'monitor-only':
        return value > 0 && percentile > 0.3 && percentile <= 0.6;
      case 'pay-attention':
        return value > 0 && percentile > 0.6;
      case 'all':
      default:
        return true;
    }
  });
}

// Sort chemicals by percentile (highest first)
export function sortChemicalsByPercentile(chemicals: ChemicalData[]): ChemicalData[] {
  return [...chemicals].sort((a, b) => {
    const aPercentile = a.percentile || 0;
    const bPercentile = b.percentile || 0;
    return bPercentile - aPercentile;
  });
}

// Percentile-based color for individual chemicals
export function getPercentileColor(percentile?: number, value?: number): string {
  if (value === 0) return EXPOSURE_COLOR_CLASSES.notDetected.text;
  if (!percentile || percentile <= 0.3) return EXPOSURE_COLOR_CLASSES.lowExposure.text;
  if (percentile > 0.6) return EXPOSURE_COLOR_CLASSES.payAttention.text;
  return EXPOSURE_COLOR_CLASSES.monitorOnly.text;
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
      bgColor: 'bg-transparent border border-white',
      textColor: 'text-white'
    };
  } else if (!percentile || percentile <= 0.3) {
    return {
      color: EXPOSURE_COLOR_CLASSES.lowExposure.bg,
      text: 'Low Exposure',
      bgColor: `bg-transparent border ${EXPOSURE_COLOR_CLASSES.lowExposure.border}`,
      textColor: EXPOSURE_COLOR_CLASSES.lowExposure.text
    };
  } else if (percentile > 0.6) {
    return {
      color: EXPOSURE_COLOR_CLASSES.payAttention.bg,
      text: 'Pay Attention',
      bgColor: `bg-transparent border ${EXPOSURE_COLOR_CLASSES.payAttention.border}`,
      textColor: EXPOSURE_COLOR_CLASSES.payAttention.text
    };
  } else {
    return {
      color: EXPOSURE_COLOR_CLASSES.monitorOnly.bg,
      text: 'Monitor Only',
      bgColor: `bg-transparent border ${EXPOSURE_COLOR_CLASSES.monitorOnly.border}`,
      textColor: EXPOSURE_COLOR_CLASSES.monitorOnly.text
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
        chemicals: sortChemicalsByPercentile(chemicals)
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
      color: EXPOSURE_COLOR_CLASSES.payAttention.bg,
      text: 'Pay Attention',
      bgColor: `bg-transparent border ${EXPOSURE_COLOR_CLASSES.payAttention.border}`,
      textColor: EXPOSURE_COLOR_CLASSES.payAttention.text
    };
  } else if (monitorOnlyCount >= 3 || payAttentionCount >= 1) {
    // If 3+ Monitor Only OR 1+ Pay Attention, category is Monitor Only
    return {
      color: EXPOSURE_COLOR_CLASSES.monitorOnly.bg,
      text: 'Monitor Only',
      bgColor: `bg-transparent border ${EXPOSURE_COLOR_CLASSES.monitorOnly.border}`,
      textColor: EXPOSURE_COLOR_CLASSES.monitorOnly.text
    };
  } else {
    // If <3 Monitor Only and no Pay Attention, category is Low Exposure
    return {
      color: EXPOSURE_COLOR_CLASSES.lowExposure.bg,
      text: 'Low Exposure',
      bgColor: `bg-transparent border ${EXPOSURE_COLOR_CLASSES.lowExposure.border}`,
      textColor: EXPOSURE_COLOR_CLASSES.lowExposure.text
    };
  }
}

// Get percentile distribution counts by range
export function getPercentileDistribution(chemicals: ChemicalData[]) {
  const distribution = {
    notDetected: 0,
    lowExposure: 0,      // 0-30%
    monitorOnly: 0,     // 30-60%
    payAttention: 0     // 60-100%
  };

  chemicals.forEach(chemical => {
    if (chemical.value === 0) {
      distribution.notDetected++;
    } else {
      const percentile = chemical.percentile || 0;
      if (percentile <= 0.3) {
        distribution.lowExposure++;
      } else if (percentile <= 0.6) {
        distribution.monitorOnly++;
      } else {
        distribution.payAttention++;
      }
    }
  });

  return distribution;
}

// Get source distribution grouped by primarySource
export function getSourceDistribution(chemicals: ChemicalData[]) {
  const sourceMap = new Map<string, number>();
  
  chemicals.forEach(chemical => {
    const source = chemical.primarySource || 'Unknown';
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
  });

  // Convert to array and sort by count
  return Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

// Calculate category insights
export interface CategoryInsight {
  type: 'averagePercentile' | 'highestPercentile' | 'detectionRate' | 'mostCommonSource' | 'categoryComparison';
  label: string;
  value: string | number;
  subValue?: string;
  meaningful: boolean;
}

export function calculateCategoryInsights(
  chemicals: ChemicalData[],
  allCategories?: ChemicalData[]
): CategoryInsight[] {
  const insights: CategoryInsight[] = [];
  const detectedChemicals = chemicals.filter(c => c.value > 0);
  const totalCount = chemicals.length;
  const detectedCount = detectedChemicals.length;

  // Average percentile (only if meaningful)
  if (detectedCount > 0) {
    const avgPercentile = detectedChemicals.reduce((sum, c) => sum + (c.percentile || 0), 0) / detectedCount;
    insights.push({
      type: 'averagePercentile',
      label: 'Average Percentile',
      value: Math.round(avgPercentile * 100),
      subValue: 'of detected chemicals',
      meaningful: true
    });
  }

  // Highest percentile chemical
  if (detectedCount > 0) {
    const highest = detectedChemicals.reduce((max, c) => {
      const p = c.percentile || 0;
      return p > (max.percentile || 0) ? c : max;
    }, detectedChemicals[0]);
    insights.push({
      type: 'highestPercentile',
      label: 'Highest Exposure',
      value: highest.compound,
      subValue: `${formatPercentile(highest.percentile, highest.value)} percentile`,
      meaningful: true
    });
  }

  // Detection rate
  insights.push({
    type: 'detectionRate',
    label: 'Detection Rate',
    value: totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0,
    subValue: `${detectedCount} of ${totalCount} chemicals`,
    meaningful: totalCount > 0
  });

  // Most common source
  const sourceDist = getSourceDistribution(chemicals);
  if (sourceDist.length > 0) {
    const topSource = sourceDist[0];
    insights.push({
      type: 'mostCommonSource',
      label: 'Most Common Source',
      value: topSource.source,
      subValue: `${topSource.count} chemical${topSource.count !== 1 ? 's' : ''}`,
      meaningful: true
    });
  }

  // Category comparison (if allCategories provided)
  if (allCategories && detectedCount > 0) {
    const categoryGroups = groupChemicalsByCategory(allCategories);
    const categoryStats = getCategoryStats(categoryGroups);
    const currentCategoryAvg = detectedChemicals.reduce((sum, c) => sum + (c.percentile || 0), 0) / detectedCount;
    
    // Compare to average of all other categories
    let otherCategoriesAvg = 0;
    let otherCategoriesCount = 0;
    
    categoryStats.forEach(({ chemicals: catChemicals }) => {
      const catDetected = catChemicals.filter(c => c.value > 0);
      if (catDetected.length > 0) {
        const catAvg = catDetected.reduce((sum, c) => sum + (c.percentile || 0), 0) / catDetected.length;
        otherCategoriesAvg += catAvg;
        otherCategoriesCount++;
      }
    });

    if (otherCategoriesCount > 0) {
      otherCategoriesAvg /= otherCategoriesCount;
      const diff = ((currentCategoryAvg - otherCategoriesAvg) / otherCategoriesAvg) * 100;
      insights.push({
        type: 'categoryComparison',
        label: 'vs. Other Categories',
        value: diff > 0 ? `+${Math.round(diff)}%` : `${Math.round(diff)}%`,
        subValue: diff > 0 ? 'higher than average' : 'lower than average',
        meaningful: Math.abs(diff) > 5 // Only show if meaningful difference
      });
    }
  }

  return insights.filter(insight => insight.meaningful);
}