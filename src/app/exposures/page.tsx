'use client';

import { useState, useEffect } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { groupChemicalsByCategory, getCategoryStats, getPercentileColor, formatPercentile, getChemicalStatusInfo, filterChemicalsByExposure, sortChemicalsByPercentile, ExposureFilterType } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import Link from 'next/link';
import CategoriesSidebar from '@/components/CategoriesSidebar';
import ExposureFilterButtons from '@/components/ExposureFilterButtons';
import { ChemicalData } from '@/app/api/csv-parser';

export default function AllExposuresPage() {
  const { selectedTest } = useTest();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exposureFilter, setExposureFilter] = useState<ExposureFilterType>('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await parseChemicalsCSV(selectedTest);
        setChemicals(data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
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
  
  const filteredChemicals = sortChemicalsByPercentile(
    filterChemicalsByExposure(chemicals, exposureFilter)
  );
  
  const detectedCount = filteredChemicals.filter(c => c.value > 0).length;
  const totalCount = filteredChemicals.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <CategoriesSidebar categories={categoriesWithStats} currentCategory="all-exposures" />

        <div className="flex-1">
          <div className="container mx-auto px-8 py-8 max-w-7xl">
            <div className="mb-8">
              <Link href="/categories" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Categories
              </Link>
              
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">All Chemical Exposures</h1>
                  <p className="text-gray-600">Viewing all chemicals across all categories</p>
                  <p className="text-sm text-gray-500 mt-1">Detected {detectedCount}/{totalCount} exposures</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">
                    {chemicals.length} total chemicals
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Chemicals</h2>
                <ExposureFilterButtons 
                  currentFilter={exposureFilter}
                  onFilterChange={setExposureFilter}
                />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-3">Chemical Name</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2 text-center">Measured Value</div>
                    <div className="col-span-1 text-center">Percentile</div>
                    <div className="col-span-2">Primary Source</div>
                    <div className="col-span-2">Status</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {filteredChemicals.map((chemical, index) => {
                    const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
                    return (
                      <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <Link 
                              href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                              className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block"
                            >
                              {chemical.compound}
                            </Link>
                          </div>
                          <div className="col-span-2">
                            <Link
                              href={`/category/${encodeURIComponent(chemical.exposureCategory)}`}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                            >
                              {chemical.exposureCategory}
                            </Link>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-sm text-gray-700">
                              {chemical.value > 0 ? `${chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL` : 'Not Detected'}
                            </span>
                          </div>
                          <div className="col-span-1 text-center">
                            <span className={`text-sm font-bold ${getPercentileColor(chemical.percentile, chemical.value)}`}>
                              {formatPercentile(chemical.percentile, chemical.value)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600 truncate">
                              {chemical.primarySource}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Showing {filteredChemicals.length} chemicals across {categoriesWithStats.length} categories
              {exposureFilter !== 'all' && (
                <span className="ml-2">
                  (filtered by {exposureFilter.replace('-', ' ')})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}