'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';
import { ChemicalData } from '@/app/api/csv-parser';
import { getCategoryStatusInfo, calculateCategoryInsights } from '@/app/api/utils';
import { CategoryOverview } from '@/data/category-overviews';
import { getCategoryIcon } from '@/lib/category-icons';

interface CategoryCardProps {
  categoryName: string;
  chemicals: ChemicalData[];
  allCategories?: ChemicalData[];
  overview?: CategoryOverview;
  index: number;
}


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
        className="block h-full bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-lg hover:border-[#404B69]/50 transition-all duration-300 group"
      >
        {/* Header */}
        <div className="mb-3 lg:mb-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="bg-[#9CBB04]/20 p-2 rounded-lg text-[#9CBB04] flex-shrink-0 group-hover:bg-[#9CBB04]/30 transition-colors">
              {getCategoryIcon(categoryName)}
            </div>
            <h3 className="text-base lg:text-lg font-bold text-gray-900">
              {categoryName}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4 line-clamp-3">
          {briefDescription}
        </p>

        {/* Classification Tag */}
        <div className="mb-3">
          <div className={`w-full px-3 py-2 rounded-lg text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
            {statusInfo.text}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-3 lg:mb-4">
          <div className="bg-gray-50 rounded-lg p-2 lg:p-3">
            <div className="text-xs text-gray-600 mb-1">Detection Rate</div>
            <div className="text-base lg:text-lg font-bold text-gray-900">{detectionRate}%</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 lg:p-3">
            <div className="text-xs text-gray-600 mb-1">Total Chemicals</div>
            <div className="text-base lg:text-lg font-bold text-gray-900">{totalCount}</div>
          </div>
        </div>

        {/* Top Insight */}
        {topInsight && (
          <div className="bg-[#404B69]/5 rounded-lg p-3 mb-4 border border-[#404B69]/10">
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
          <div className="flex items-center text-[#404B69] text-sm font-medium group-hover:text-[#9CBB04] transition-colors">
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

