'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { getPercentileColor, formatPercentile, getChemicalStatusInfo, filterChemicalsByExposure, sortChemicalsByPercentile, ExposureFilterType } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import Link from 'next/link';
import ExposureFilterButtons from '@/components/ExposureFilterButtons';
import ChemicalSearchBar from '@/components/ChemicalSearchBar';
import { ChemicalData } from '@/app/api/csv-parser';

function AllExposuresPageContent() {
  const { selectedTest } = useTest();
  const searchParams = useSearchParams();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exposureFilter, setExposureFilter] = useState<ExposureFilterType>('all');
  const [expandedChemical, setExpandedChemical] = useState<string | null>(null);
  const chemicalRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Read filter from URL on mount
  useEffect(() => {
    const filterParam = searchParams?.get('filter');
    if (filterParam) {
      const validFilters: ExposureFilterType[] = ['all', 'pay-attention', 'monitor-only', 'low-exposure', 'not-detected'];
      if (validFilters.includes(filterParam as ExposureFilterType)) {
        setExposureFilter(filterParam as ExposureFilterType);
      }
    }
  }, [searchParams]);

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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  const filteredChemicals = sortChemicalsByPercentile(
    filterChemicalsByExposure(chemicals, exposureFilter)
  );
  
  const detectedCount = filteredChemicals.filter(c => c.value > 0).length;
  const totalCount = filteredChemicals.length;
  const uniqueCategories = new Set(filteredChemicals.map(c => c.exposureCategory)).size;

  // Handle chemical selection from search bar
  const handleChemicalSelect = (chemical: ChemicalData) => {
    setExpandedChemical(chemical.compound);
    // Scroll to the chemical after a brief delay to ensure DOM is updated
    setTimeout(() => {
      const ref = chemicalRefs.current[chemical.compound];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                All Chemical Exposures
                <span className="text-teal-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </h1>
              <p className="text-gray-600">Viewing all chemicals across all categories</p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="text-teal-600 font-semibold">Detected {detectedCount}/{totalCount}</span> exposures
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 px-4 py-2 rounded-lg shadow-sm">
              <span className="text-sm font-medium text-teal-700">
                {chemicals.length} total chemicals
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <ExposureFilterButtons 
              currentFilter={exposureFilter}
              onFilterChange={setExposureFilter}
            />
            <ChemicalSearchBar
              chemicals={filteredChemicals}
              onSelect={handleChemicalSelect}
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-[#1a2540]">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white">
                <div className="col-span-3">Chemical Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2 text-center">Measured Value</div>
                <div className="col-span-1 text-center">Percentile</div>
                <div className="col-span-2">Primary Source</div>
                <div className="col-span-2">Status</div>
              </div>
            </div>
            <div>
              {filteredChemicals.map((chemical, index) => {
                const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
                const isExpanded = expandedChemical === chemical.compound;
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={index}
                    ref={(el) => {
                      chemicalRefs.current[chemical.compound] = el;
                    }}
                  >
                    {/* Clickable Row */}
                    <div
                      onClick={() => setExpandedChemical(isExpanded ? null : chemical.compound)}
                      className={`px-6 py-3.5 transition-all duration-200 cursor-pointer ${
                        isExpanded 
                          ? 'bg-gray-100' 
                          : isEven 
                            ? 'bg-white hover:bg-gray-50' 
                            : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 flex items-center gap-2">
                          <svg 
                            className={`w-4 h-4 text-teal-600 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <Link 
                            href={`/chemical/${encodeURIComponent(chemical.compound)}?from=exposures`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm font-semibold text-gray-900 hover:text-teal-600 truncate block transition-colors"
                          >
                            {chemical.compound}
                          </Link>
                        </div>
                        <div className="col-span-2">
                          <Link
                            href={`/categories?category=${encodeURIComponent(chemical.exposureCategory)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-teal-600 hover:text-teal-700 hover:underline truncate block transition-colors font-medium"
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
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <Link
                        href={`/chemical/${encodeURIComponent(chemical.compound)}?from=exposures`}
                        className={`block px-6 py-4 cursor-pointer transition-colors ${
                          isEven ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-600 mb-1">Primary Source</h4>
                            <p className="text-sm text-gray-900">{chemical.primarySource}</p>
                          </div>
                          {chemical.secondarySources && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Secondary Sources</h4>
                              <p className="text-sm text-gray-900">{chemical.secondarySources}</p>
                            </div>
                          )}
                          {chemical.rangeLow !== undefined && chemical.rangeHigh !== undefined && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Exposure Range</h4>
                              <p className="text-sm text-gray-900">
                                {chemical.rangeLow.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} - {chemical.rangeHigh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                              </p>
                            </div>
                          )}
                          {chemical.population !== undefined && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-600 mb-1">Population Exposed</h4>
                              <p className="text-sm text-gray-900">{(chemical.population * 100).toFixed(1)}%</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="inline-flex items-center text-teal-600 hover:text-teal-700 transition-colors text-sm font-medium group">
                          View Full Page
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 text-center">
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Showing <span className="text-teal-600 font-semibold">{filteredChemicals.length}</span> chemicals across <span className="text-teal-600 font-semibold">{uniqueCategories}</span> categories
            {exposureFilter !== 'all' && (
              <span className="ml-2 text-teal-600">
                (filtered by {exposureFilter.replace('-', ' ')})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AllExposuresPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exposures...</p>
        </div>
      </div>
    }>
      <AllExposuresPageContent />
    </Suspense>
  );
}