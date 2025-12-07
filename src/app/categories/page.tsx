'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { useTest } from '@/contexts/TestContext';
import { groupChemicalsByCategory, getCategoryStats, getPercentileDistribution, getChemicalStatusInfo, filterChemicalsByExposure, sortChemicalsByPercentile, ExposureFilterType, formatPercentile, getPercentileColor } from '@/app/api/utils';
import { EXPOSURE_COLOR_CLASSES } from '@/lib/colors';
import { findCategoryOverview, getAllCategoryNames } from '@/data/category-overviews';
import { ChemicalData } from '@/app/api/csv-parser';
import CategoryCard from '@/components/CategoryCard';
import CategoryOverviewDashboard from '@/components/CategoryOverviewDashboard';
import CategoryOverview from '@/components/CategoryOverview';
import ExposureFilterButtons from '@/components/ExposureFilterButtons';
import Link from 'next/link';

function CategoriesPageContent() {
  const { selectedTest } = useTest();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, ExposureFilterType>>({});
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'chemicals'>('overview');
  const [expandedChemical, setExpandedChemical] = useState<string | null>(null);
  
  // Get the current filter for the selected category, defaulting to 'all' if not set
  const getCurrentCategoryFilter = useCallback((category: string): ExposureFilterType => {
    return categoryFilters[category] || 'all';
  }, [categoryFilters]);
  
  // Update filter for a specific category
  const updateCategoryFilter = (category: string, filter: ExposureFilterType) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: filter
    }));
  };
  
  // Get current exposure filter based on selected category
  const exposureFilter = selectedCategory
    ? getCurrentCategoryFilter(selectedCategory)
    : 'all';

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

  // Read all state from URL query parameters on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(decodeURIComponent(categoryParam));
    } else {
      setSelectedCategory(null);
    }
    
    // Restore viewMode from URL
    const viewModeParam = searchParams.get('view');
    if (viewModeParam === 'overview' || viewModeParam === 'details' || viewModeParam === 'chemicals') {
      setViewMode(viewModeParam);
    }
    
    // Restore expandedChemical from URL
    const expandedParam = searchParams.get('expanded');
    if (expandedParam) {
      setExpandedChemical(decodeURIComponent(expandedParam));
    }
    
    // Restore filters from URL
    const filterParam = searchParams.get('filter');
    if (filterParam && categoryParam) {
      const validFilters: ExposureFilterType[] = ['all', 'pay-attention', 'monitor-only', 'low-exposure', 'not-detected'];
      if (validFilters.includes(filterParam as ExposureFilterType)) {
        setCategoryFilters({ [decodeURIComponent(categoryParam)]: filterParam as ExposureFilterType });
      }
    }
  }, [searchParams]);

  // Helper function to build current URL with state
  const buildStateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    
    if (viewMode && selectedCategory) {
      params.set('view', viewMode);
    }
    
    if (expandedChemical && selectedCategory) {
      params.set('expanded', expandedChemical);
    }
    
    const currentFilter = selectedCategory
      ? getCurrentCategoryFilter(selectedCategory)
      : 'all';
    
    if (currentFilter !== 'all' && selectedCategory) {
      params.set('filter', currentFilter);
    }
    
    return params.toString() ? `/categories?${params.toString()}` : '/categories';
  }, [selectedCategory, viewMode, expandedChemical, getCurrentCategoryFilter]);

  // Update URL when state changes
  useEffect(() => {
    if (!chemicals.length) return;
    
    const newUrl = buildStateUrl();
    const currentUrl = window.location.pathname + window.location.search;
    
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [buildStateUrl, router, chemicals.length]);

  // Reset view mode to overview when category changes (but preserve if coming from URL)
  useEffect(() => {
    if (selectedCategory) {
      const viewModeParam = searchParams.get('view');
      if (!viewModeParam) {
        setViewMode('overview');
      }
      const expandedParam = searchParams.get('expanded');
      if (!expandedParam) {
        setExpandedChemical(null);
      }
    }
  }, [selectedCategory, searchParams]);

  // Scroll to top when category changes
  useEffect(() => {
    if (selectedCategory && chemicals.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory, chemicals.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  const categoryGroups = groupChemicalsByCategory(chemicals);
  const categoriesWithStats = getCategoryStats(categoryGroups);
  const allCategoryNames = getAllCategoryNames();

  // Get overall statistics
  const totalChemicals = chemicals.length;
  const totalDetected = chemicals.filter(c => c.value > 0).length;
  const overallDetectionRate = totalChemicals > 0 ? Math.round((totalDetected / totalChemicals) * 100) : 0;
  const overallDistribution = getPercentileDistribution(chemicals);

  // Create a map of category stats for quick lookup
  const categoryStatsMap = new Map(
    categoriesWithStats.map(stat => [stat.category, stat])
  );

  // Get all categories (including those with no data) and sort them
  const allCategories = allCategoryNames.map(categoryName => {
    const stats = categoryStatsMap.get(categoryName);
    return {
      name: categoryName,
      chemicals: stats?.chemicals || [],
      detectedCount: stats?.detectedCount || 0,
      totalCount: stats?.totalCount || 0,
      overview: findCategoryOverview(categoryName) || undefined
    };
  }).sort((a, b) => {
    // Sort by detected count (descending), then by name
    if (b.detectedCount !== a.detectedCount) {
      return b.detectedCount - a.detectedCount;
    }
    return a.name.localeCompare(b.name);
  });

  // Get selected category chemicals and stats
  const selectedCategoryChemicals = selectedCategory
    ? sortChemicalsByPercentile(
        filterChemicalsByExposure(
          chemicals.filter(chemical => chemical.exposureCategory === selectedCategory),
          exposureFilter
        )
      )
    : [];
  
  const detectedCount = selectedCategoryChemicals.filter(c => c.value > 0).length;
  const totalCount = selectedCategoryChemicals.length;

  // Show category cards grid when no category is selected
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Chemical Exposure Categories</h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Explore the six major categories of chemical exposures to understand their sources, 
              exposure pathways, and your individual exposure levels based on your test results.
            </p>
          </div>

          {/* Category Cards Grid */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCategories.map((category, index) => (
                <CategoryCard
                  key={category.name}
                  categoryName={category.name}
                  chemicals={category.chemicals}
                  allCategories={chemicals}
                  overview={category.overview}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#1a2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Overall Exposure Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Chemicals</div>
                <div className="text-2xl font-bold text-gray-900">{totalChemicals}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Detected</div>
                <div className="text-2xl font-bold text-gray-900">{totalDetected}</div>
                <div className="text-xs text-gray-500 mt-1">{overallDetectionRate}% detection rate</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Low Exposure</div>
                <div className={`text-2xl font-bold ${EXPOSURE_COLOR_CLASSES.lowExposure.text}`}>{overallDistribution.lowExposure}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Monitor / Pay Attention</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {overallDistribution.monitorOnly + overallDistribution.payAttention}
                </div>
              </div>
            </div>
          </div>

          {/* Learn More Section */}
          <div className="bg-gradient-to-r from-[#1a2540] to-[#1a2540]/90 rounded-lg p-6 mb-8 text-white">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Understanding Categories
            </h2>
            <p className="text-white/90 mb-4">
              Chemicals are organized into six categories based on their primary sources, uses, and exposure pathways. 
              This structure helps you understand not just what chemicals are present, but where they come from and 
              how they enter your body.
            </p>
            <p className="text-white/80 text-sm">
              Each category includes detailed information about exposure pathways, health implications, and regulatory context. 
              Click on any category card above to explore detailed insights about your exposure levels.
            </p>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Data based on test results. For detailed information about individual chemicals, 
              visit the{' '}
              <Link href="/" className="text-[#1a2540] hover:text-teal-600 underline">
                main dashboard
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show category detail view when a category is selected
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto py-8 max-w-7xl px-8">
        <div className="flex items-start relative">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div>
              <div className="mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedCategory}</h1>
                    <p className="text-gray-600">Detected {detectedCount}/{totalCount} exposures</p>
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">
                      {totalCount} chemicals
                    </span>
                  </div>
                </div>
                
                    {/* View Toggle */}
                    <div className="flex items-center gap-2 mb-6">
                      <button
                        onClick={() => setViewMode('overview')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          viewMode === 'overview'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setViewMode('details')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          viewMode === 'details'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setViewMode('chemicals')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          viewMode === 'chemicals'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        Chemical List
                      </button>
                    </div>
              </div>

              {/* Overview Section */}
              {viewMode === 'overview' && selectedCategory && (
                <CategoryOverviewDashboard
                  categoryName={selectedCategory}
                  chemicals={chemicals.filter(chemical => chemical.exposureCategory === selectedCategory)}
                  allCategories={chemicals}
                />
              )}

              {/* Details Section */}
              {viewMode === 'details' && selectedCategory && (() => {
                const categoryOverview = findCategoryOverview(selectedCategory);
                return categoryOverview ? (
                  <CategoryOverview data={categoryOverview} />
                ) : null;
              })()}

              {/* Chemical List Section */}
              {viewMode === 'chemicals' && (
                <div className="mb-8">
                  <div className="flex items-center justify-end mb-6">
                    <ExposureFilterButtons 
                      currentFilter={exposureFilter}
                      onFilterChange={(filter) => {
                        if (selectedCategory) {
                          updateCategoryFilter(selectedCategory, filter);
                        }
                      }}
                    />
                  </div>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-white border-b-4 border-teal-600">
                      <div className="grid grid-cols-12 gap-4 text-sm font-bold text-gray-900  tracking-wide">
                        <div className="col-span-4">Chemical Name</div>
                        <div className="col-span-2 text-center">Measured Value</div>
                        <div className="col-span-2 text-center">Percentile</div>
                        <div className="col-span-2">Primary Source</div>
                        <div className="col-span-2">Status</div>
                      </div>
                    </div>
                    <div>
                      {selectedCategoryChemicals.map((chemical, index) => {
                        const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
                        const isExpanded = expandedChemical === chemical.compound;
                        const isEven = index % 2 === 0;
                        
                        return (
                          <div key={index}>
                            {/* Clickable Row */}
                            <div
                              onClick={() => setExpandedChemical(isExpanded ? null : chemical.compound)}
                              className={`px-6 py-3.5 transition-all duration-200 cursor-pointer ${
                                isEven ? 'bg-white' : 'bg-gray-50'
                              } hover:bg-gray-100`}
                            >
                              <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4 flex items-center gap-2">
                                  <svg 
                                    className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                                    {chemical.compound}
                                  </h3>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className="text-sm text-gray-700">
                                    {chemical.value > 0 ? `${chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL` : 'Not Detected'}
                                  </span>
                                </div>
                                <div className="col-span-2 text-center">
                                  <span className={`text-lg font-bold ${getPercentileColor(chemical.percentile, chemical.value)}`}>
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
                                href={`/chemical/${encodeURIComponent(chemical.compound)}?from=categories`}
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
                                
                                <div className="inline-flex items-center text-[#1a2540] hover:text-[#1a2540]/80 transition-colors text-sm font-medium">
                                  View Full Page
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  
                  <div className="text-sm text-gray-500 text-center mt-4">
                    Showing {selectedCategoryChemicals.length} chemicals in {selectedCategory}
                    {exposureFilter !== 'all' && (
                      <span className="ml-2">
                        (filtered by {exposureFilter.replace('-', ' ')})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    }>
      <CategoriesPageContent />
    </Suspense>
  );
}
