'use client';

import { motion } from 'framer-motion';
import { CategoryInsight } from '@/app/api/utils';

interface CategoryInsightsPanelProps {
  insights: CategoryInsight[];
}

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

