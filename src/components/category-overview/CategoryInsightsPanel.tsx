'use client';

import { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { CategoryInsight } from '@/app/api/utils';

interface CategoryInsightsPanelProps {
  insights: CategoryInsight[];
}

const iconMap: Record<string, ReactElement> = {
  averagePercentile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  highestPercentile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  detectionRate: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  mostCommonSource: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  categoryComparison: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
};

export default function CategoryInsightsPanel({ insights }: CategoryInsightsPanelProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="grid grid-cols-auto gap-1" style={{ gridTemplateColumns: `repeat(${insights.length}, minmax(0, 1fr))` }}>
        {insights.map((insight, index) => (
          <motion.div
            key={insight.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-[#1a2540]/50 hover:shadow-md transition-all duration-300"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-600 mb-0.5">{insight.label}</div>
              <div className="text-base font-bold text-gray-900 mb-0.5 truncate">
                {typeof insight.value === 'number' && insight.type === 'detectionRate' 
                  ? `${insight.value}%`
                  : typeof insight.value === 'number' && insight.type === 'averagePercentile'
                  ? `${insight.value}%`
                  : insight.value}
              </div>
              {insight.subValue && (
                <div className="text-xs text-gray-500 truncate">{insight.subValue}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

