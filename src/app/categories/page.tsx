'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CategoriesSidebar from '@/components/CategoriesSidebar';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { groupChemicalsByCategory, getCategoryStats, getPercentileColor, formatPercentile, getCategoryStatusInfo } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import { ChemicalData } from '@/app/api/csv-parser';

export default function CategoriesPage() {
  const { selectedTest } = useTest();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChemicals() {
      setLoading(true);
      try {
        const data = await parseChemicalsCSV(selectedTest);
        setChemicals(data);
      } catch (error) {
        console.error('Error loading chemicals:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadChemicals();
  }, [selectedTest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  const categoryGroups = groupChemicalsByCategory(chemicals);
  const categoriesWithStats = getCategoryStats(categoryGroups);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <CategoriesSidebar categories={categoriesWithStats} />

        <div className="flex-1">
          <div className="container mx-auto px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Health Categories</h1>
              <p className="text-gray-600 mt-2">Detailed view of all health categories and their chemical exposures</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {categoriesWithStats.map(({ category, chemicals, detectedCount, totalCount }) => {
                const status = getCategoryStatusInfo(chemicals);
                
                return (
                  <Link key={category} href={`/category/${encodeURIComponent(category)}`} className="block">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2">{category}</h2>
                          <p className="text-sm text-gray-600 mb-3">Detected {detectedCount}/{totalCount} exposures</p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Pay Attention: {totalCount > 0 ? Math.round((chemicals.filter(c => (c.percentile || 0) > 0.6).length / totalCount) * 100) : 0}%</div>
                            <div>Monitor Only: {totalCount > 0 ? Math.round((chemicals.filter(c => { const p = c.percentile || 0; return p > 0.1 && p <= 0.6; }).length / totalCount) * 100) : 0}%</div>
                            <div>Optimal: {totalCount > 0 ? Math.round((chemicals.filter(c => (c.percentile || 0) <= 0.1).length / totalCount) * 100) : 0}%</div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full ${status.bgColor}`}>
                          <span className={`text-xs font-medium ${status.textColor}`}>{status.text}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {chemicals.slice(0, 3).map((chemical, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">
                              {chemical.compound}
                            </h3>
                            <span className={`text-sm font-bold ml-3 ${getPercentileColor(chemical.percentile)}`}>
                              {formatPercentile(chemical.percentile)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Showing {chemicals.length} chemical entries across {categoriesWithStats.length} categories
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
