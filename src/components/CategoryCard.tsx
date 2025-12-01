'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChemicalData } from '@/app/api/csv-parser';
import { getCategoryStatusInfo, calculateCategoryInsights } from '@/app/api/utils';
import { CategoryOverview } from '@/data/category-overviews';

interface CategoryCardProps {
  categoryName: string;
  chemicals: ChemicalData[];
  allCategories?: ChemicalData[];
  overview?: CategoryOverview;
  index: number;
}

// Icon mapping for different categories
const getCategoryIcon = (categoryName: string) => {
  const iconMap: Record<string, JSX.Element> = {
    'Agricultural Chemicals': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    'Containers & Coatings': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    'Household Products': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    'Industrial Chemicals': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    'Persistent Pollutants': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    'Personal Care Products': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    ),
  };

  return iconMap[categoryName] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
};

export default function CategoryCard({
  categoryName,
  chemicals,
  allCategories,
  overview,
  index
}: CategoryCardProps) {
  const detectedCount = chemicals.filter(c => c.value > 0).length;
  const totalCount = chemicals.length;
  const detectionRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
  
  const statusInfo = getCategoryStatusInfo(chemicals);
  const insights = calculateCategoryInsights(chemicals, allCategories);
  
  // Get brief description from overview (first section's content)
  const briefDescription = overview?.summary_sections?.[0]?.content 
    ? overview.summary_sections[0].content.substring(0, 150) + (overview.summary_sections[0].content.length > 150 ? '...' : '')
    : 'Explore chemicals in this category and understand your exposure levels.';

  // Get top insight
  const topInsight = insights.length > 0 ? insights[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link
        href={`/categories?category=${encodeURIComponent(categoryName)}`}
        className="block h-full bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg hover:border-[#1a2540]/50 transition-all duration-300 group"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-teal-100 p-2 rounded-lg text-teal-600 flex-shrink-0 group-hover:bg-teal-200 transition-colors">
              {getCategoryIcon(categoryName)}
            </div>
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {categoryName}
            </h3>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusInfo.bgColor} ${statusInfo.textColor}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {briefDescription}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Detection Rate</div>
            <div className="text-lg font-bold text-gray-900">{detectionRate}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Total Chemicals</div>
            <div className="text-lg font-bold text-gray-900">{totalCount}</div>
          </div>
        </div>

        {/* Top Insight */}
        {topInsight && (
          <div className="bg-[#1a2540]/5 rounded-lg p-3 mb-4 border border-[#1a2540]/10">
            <div className="text-xs font-medium text-gray-600 mb-1">{topInsight.label}</div>
            <div className="text-sm font-semibold text-gray-900">
              {typeof topInsight.value === 'number' && (topInsight.type === 'detectionRate' || topInsight.type === 'averagePercentile')
                ? `${topInsight.value}%`
                : topInsight.value}
            </div>
            {topInsight.subValue && (
              <div className="text-xs text-gray-500 mt-1">{topInsight.subValue}</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {detectedCount} of {totalCount} detected
          </div>
          <div className="flex items-center text-[#1a2540] text-sm font-medium group-hover:text-teal-600 transition-colors">
            <span>Explore</span>
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

