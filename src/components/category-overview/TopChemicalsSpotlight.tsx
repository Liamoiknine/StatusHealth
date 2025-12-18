'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChemicalData } from '@/app/api/csv-parser';
import { getChemicalStatusInfo, formatPercentile, getPercentileColor, sortChemicalsByPercentile } from '@/app/api/utils';

interface TopChemicalsSpotlightProps {
  chemicals: ChemicalData[];
  maxCount?: number;
}

export default function TopChemicalsSpotlight({ 
  chemicals, 
  maxCount = 3 
}: TopChemicalsSpotlightProps) {
  const detectedChemicals = chemicals.filter(c => c.value > 0);
  const sortedChemicals = sortChemicalsByPercentile(detectedChemicals);
  const topChemicals = sortedChemicals.slice(0, maxCount);

  if (topChemicals.length === 0) {
    return (
      <div>
        <p className="text-gray-600 text-center py-8">No detected chemicals in this category</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {topChemicals.map((chemical, index) => {
          const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
          const percentileColor = getPercentileColor(chemical.percentile, chemical.value);
          
          return (
            <motion.div
              key={chemical.compound}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <Link
                href={`/chemical/${encodeURIComponent(chemical.compound)}?from=categories`}
                className="block bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:border-[#9CBB04] hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 flex-1 line-clamp-2">
                    {chemical.compound}
                  </h4>
                  <div className={`text-base font-bold ml-2 ${percentileColor}`}>
                    {formatPercentile(chemical.percentile, chemical.value)}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Value</span>
                    <span className="text-xs text-gray-700">
                      {chemical.value.toLocaleString(undefined, { 
                        minimumFractionDigits: 1, 
                        maximumFractionDigits: 1 
                      })} ng/mL
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  
                  {chemical.primarySource && (
                    <div className="pt-1.5 border-t border-gray-200">
                    <span className="text-xs text-gray-600 truncate block">
                      {chemical.primarySource}
                    </span>
                  </div>
                  )}
                </div>
                
                <div className="mt-2 flex items-center text-[#9CBB04] text-xs">
                  <span>View details</span>
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

