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
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-[#1a2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Top Chemicals
        </h3>
        <p className="text-gray-600 text-center py-8">No detected chemicals in this category</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-[#1a2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Top Chemicals
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-teal-500 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex-1 line-clamp-2">
                    {chemical.compound}
                  </h4>
                  <div className={`text-lg font-bold ml-2 ${percentileColor}`}>
                    {formatPercentile(chemical.percentile, chemical.value)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Value</span>
                    <span className="text-sm text-gray-700">
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
                    <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-600 truncate block">
                      {chemical.primarySource}
                    </span>
                  </div>
                  )}
                </div>
                
                <div className="mt-3 flex items-center text-teal-600 text-xs">
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

