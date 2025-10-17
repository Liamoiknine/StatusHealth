'use client';

import { useState, useEffect } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { groupChemicalsByCategory, getCategoryStats, getPercentileColor, formatPercentile, getChemicalStatusInfo } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import Link from 'next/link';
import CategoriesSidebar from '@/components/CategoriesSidebar';
import { ChemicalData } from '@/app/api/csv-parser';


export default function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { selectedTest } = useTest();
  const [categoryName, setCategoryName] = useState<string>('');
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exposureFilter, setExposureFilter] = useState<'all' | 'pay-attention' | 'monitor-only' | 'optimal'>('pay-attention');

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
  
  // Filter chemicals by exposure level
  const categoryChemicals = chemicals
    .filter(chemical => chemical.exposureCategory === categoryName)
    .filter(chemical => {
      const percentile = chemical.percentile || 0;
      switch (exposureFilter) {
        case 'pay-attention':
          return percentile > 0.6;
        case 'monitor-only':
          return percentile > 0.1 && percentile <= 0.6;
        case 'optimal':
          return percentile <= 0.1;
        case 'all':
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by percentile (highest first), treating undefined as 0
      const aPercentile = a.percentile || 0;
      const bPercentile = b.percentile || 0;
      return bPercentile - aPercentile;
    });
  
  const detectedCount = categoryChemicals.filter(c => c.value > 0).length;
  const totalCount = categoryChemicals.length;

  const info = {
    description: `Detailed information about ${categoryName} and their potential health impacts.`,
    sources: ['Various environmental and consumer sources'],
    healthImpact: 'Health impact varies by specific chemical and exposure level.'
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <CategoriesSidebar categories={categoriesWithStats} currentCategory={categoryName} />

        <div className="flex-1">
          <div className="container mx-auto px-8 py-8 max-w-5xl">
            <div className="mb-8">
              <Link href="/categories" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Categories
              </Link>
              
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName}</h1>
                  <p className="text-gray-600">Detected {detectedCount}/{totalCount} exposures</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">
                    {totalCount} total chemicals
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About {categoryName}</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">{info.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Sources</h3>
                  <ul className="space-y-2">
                    {info.sources.map((source, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                        </svg>
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Impact</h3>
                  <p className="text-gray-700 leading-relaxed">{info.healthImpact}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chemicals in this Category</h2>
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600 mr-3">Filter by exposure level:</span>
                  <button
                    onClick={() => setExposureFilter('pay-attention')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      exposureFilter === 'pay-attention'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    Pay Attention
                  </button>
                  <button
                    onClick={() => setExposureFilter('monitor-only')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      exposureFilter === 'monitor-only'
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    Monitor Only
                  </button>
                  <button
                    onClick={() => setExposureFilter('optimal')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      exposureFilter === 'optimal'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    Optimal
                  </button>
                  <button
                    onClick={() => setExposureFilter('all')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      exposureFilter === 'all'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    All Chemicals
                  </button>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-5">Chemical Name</div>
                    <div className="col-span-2 text-center">Percentile</div>
                    <div className="col-span-3">Primary Source</div>
                    <div className="col-span-2">Status</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {categoryChemicals.map((chemical, index) => {
                    const statusInfo = getChemicalStatusInfo(chemical.percentile);
                    return (
                      <Link 
                        key={index} 
                        href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                        className="block hover:bg-gray-50 transition-colors"
                      >
                        <div className="px-6 py-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-5">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {chemical.compound}
                              </h3>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className={`text-lg font-bold ${getPercentileColor(chemical.percentile)}`}>
                                {formatPercentile(chemical.percentile)}
                              </span>
                            </div>
                            <div className="col-span-3">
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
      </div>
    </div>
  );
}