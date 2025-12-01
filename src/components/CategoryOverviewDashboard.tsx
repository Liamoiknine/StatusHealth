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
      {/* Top Row: Category Trends and Top Chemicals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Category Trends - Takes 2 columns */}
        <div className="lg:col-span-2">
          <CategoryTimelineChart categoryName={categoryName} />
        </div>
        {/* Top Chemicals - Takes 1 column */}
        <div className="lg:col-span-1">
          <TopChemicalsSpotlight chemicals={chemicals} maxCount={3} />
        </div>
      </div>

      {/* Insights Panel */}
      <div className="-mt-4">
        <CategoryInsightsPanel insights={insights} />
      </div>

      {/* Exposure Source Analysis */}
      <ExposureSourceAnalysis chemicals={chemicals} />

      {/* Percentile Distribution Chart */}
      <PercentileDistributionChart chemicals={chemicals} />
    </div>
  );
}

