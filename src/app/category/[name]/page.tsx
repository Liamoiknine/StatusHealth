'use client';

import { useState, useEffect } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { getPercentileColor, formatPercentile, getChemicalStatusInfo, filterChemicalsByExposure, sortChemicalsByPercentile, ExposureFilterType } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import Link from 'next/link';
import ExposureFilterButtons from '@/components/ExposureFilterButtons';
import { ChemicalData } from '@/app/api/csv-parser';

export default function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { selectedTest } = useTest();
  const [categoryName, setCategoryName] = useState<string>('');
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exposureFilter, setExposureFilter] = useState<ExposureFilterType>('pay-attention');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const resolvedParams = await params;
        const decodedName = decodeURIComponent(resolvedParams.name);
        setCategoryName(decodedName);
        
        const data = await parseChemicalsCSV(selectedTest);
        setChemicals(data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params, selectedTest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1729] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading test data...</p>
        </div>
      </div>
    );
  }

  const categoryChemicals = sortChemicalsByPercentile(
    filterChemicalsByExposure(
      chemicals.filter(chemical => chemical.exposureCategory === categoryName),
      exposureFilter
    )
  );
  
  const detectedCount = categoryChemicals.filter(c => c.value > 0).length;
  const totalCount = categoryChemicals.length;

  const info = {
    description: `Detailed information about ${categoryName} and their potential health impacts.`,
    sources: ['Various environmental and consumer sources'],
    healthImpact: 'Health impact varies by specific chemical and exposure level.'
  };

  return (
    <div className="min-h-screen bg-[#0f1729]">
      <div className="container mx-auto px-8 py-8 max-w-5xl">
        <div className="mb-8">
          <Link href="/categories" className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </Link>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{categoryName}</h1>
              <p className="text-gray-400">Detected {detectedCount}/{totalCount} exposures</p>
            </div>
            <div className="bg-[#1a2540] border border-gray-700 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-white">
                {totalCount} total chemicals
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a2540] border border-gray-700 rounded-lg p-6 mb-8">
          <p className="text-gray-300 mb-6 leading-relaxed">{info.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Common Sources</h3>
              <ul className="space-y-2">
                {info.sources.map((source, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Health Impact</h3>
              <p className="text-gray-300 leading-relaxed">{info.healthImpact}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Chemicals in this Category</h2>
            <ExposureFilterButtons 
              currentFilter={exposureFilter}
              onFilterChange={setExposureFilter}
            />
          </div>
          <div className="bg-[#1a2540] border border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#0f1729] border-b border-gray-800">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-300">
                <div className="col-span-4">Chemical Name</div>
                <div className="col-span-2 text-center">Measured Value</div>
                <div className="col-span-2 text-center">Percentile</div>
                <div className="col-span-2">Primary Source</div>
                <div className="col-span-2">Status</div>
              </div>
            </div>
            <div className="divide-y divide-gray-800">
              {categoryChemicals.map((chemical, index) => {
                const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
                return (
                  <Link 
                    key={index} 
                    href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                    className="block hover:bg-[#0f1729] transition-colors"
                  >
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {chemical.compound}
                          </h3>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-sm text-gray-300">
                            {chemical.value > 0 ? `${chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL` : 'Not Detected'}
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={`text-lg font-bold ${getPercentileColor(chemical.percentile, chemical.value)}`}>
                            {formatPercentile(chemical.percentile, chemical.value)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-400 truncate">
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
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 text-center">
          Showing {categoryChemicals.length} chemicals in {categoryName}
          {exposureFilter !== 'all' && (
            <span className="ml-2">
              (filtered by {exposureFilter.replace('-', ' ')})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}