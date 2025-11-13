'use client';

import { ChemicalData } from '@/app/api/csv-parser';
import { calculateCategoryInsights } from '@/app/api/utils';
import CategoryInsightsPanel from './category-overview/CategoryInsightsPanel';
import PercentileDistributionChart from './category-overview/PercentileDistributionChart';
import TopChemicalsSpotlight from './category-overview/TopChemicalsSpotlight';
import ExposureSourceAnalysis from './category-overview/ExposureSourceAnalysis';
import CategoryTimelineChart from './category-overview/CategoryTimelineChart';

interface CategoryOverviewDashboardProps {
  categoryName: string;
  chemicals: ChemicalData[];
  allCategories?: ChemicalData[];
}

export default function CategoryOverviewDashboard({
  categoryName,
  chemicals,
  allCategories
}: CategoryOverviewDashboardProps) {
  const insights = calculateCategoryInsights(chemicals, allCategories);

  return (
    <div className="space-y-6">
      {/* Insights Panel */}
      <CategoryInsightsPanel insights={insights} />

      {/* Top Chemicals Spotlight */}
      <TopChemicalsSpotlight chemicals={chemicals} maxCount={5} />

      {/* Percentile Distribution Chart */}
      <PercentileDistributionChart chemicals={chemicals} />

      {/* Exposure Source Analysis */}
      <ExposureSourceAnalysis chemicals={chemicals} />

      {/* Category Timeline Chart */}
      <CategoryTimelineChart categoryName={categoryName} />
    </div>
  );
}

