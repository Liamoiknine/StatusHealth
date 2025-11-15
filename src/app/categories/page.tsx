'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { groupChemicalsByCategory, getCategoryStats, getCategoryStatusInfo, getPercentileColor, formatPercentile, getChemicalStatusInfo, filterChemicalsByExposure, sortChemicalsByPercentile, ExposureFilterType } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import ExposureFilterButtons from '@/components/ExposureFilterButtons';
import CategoryOverview from '@/components/CategoryOverview';
import AllChemicalsOverview from '@/components/AllChemicalsOverview';
import CategoryOverviewDashboard from '@/components/CategoryOverviewDashboard';
import { findCategoryOverview, getAllChemicalsOverview } from '@/data/category-overviews';
import { ChemicalData } from '@/app/api/csv-parser';

function CategoriesPageContent() {
  const { selectedTest } = useTest();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null | 'all-exposures'>('all-exposures');
  const [categoryFilters, setCategoryFilters] = useState<Record<string, ExposureFilterType>>({});
  const [allExposuresFilter, setAllExposuresFilter] = useState<ExposureFilterType>('all');
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
  const exposureFilter = selectedCategory && selectedCategory !== 'all-exposures'
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
    let restoredCategory = 'all-exposures';
    if (categoryParam) {
      restoredCategory = decodeURIComponent(categoryParam);
      setSelectedCategory(restoredCategory);
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
    if (filterParam && restoredCategory !== 'all-exposures') {
      const validFilters: ExposureFilterType[] = ['all', 'pay-attention', 'monitor-only', 'low-exposure', 'not-detected'];
      if (validFilters.includes(filterParam as ExposureFilterType)) {
        setCategoryFilters({ [restoredCategory]: filterParam as ExposureFilterType });
      }
    }
    
    const allExposuresFilterParam = searchParams.get('allExposuresFilter');
    if (allExposuresFilterParam) {
      const validFilters: ExposureFilterType[] = ['all', 'pay-attention', 'monitor-only', 'low-exposure', 'not-detected'];
      if (validFilters.includes(allExposuresFilterParam as ExposureFilterType)) {
        setAllExposuresFilter(allExposuresFilterParam as ExposureFilterType);
      }
    }
  }, [searchParams]);

  // Helper function to build current URL with state
  const buildStateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedCategory && selectedCategory !== 'all-exposures') {
      params.set('category', selectedCategory);
    }
    
    if (viewMode && selectedCategory) {
      params.set('view', viewMode);
    }
    
    if (expandedChemical && selectedCategory) {
      params.set('expanded', expandedChemical);
    }
    
    const currentFilter = selectedCategory && selectedCategory !== 'all-exposures'
      ? getCurrentCategoryFilter(selectedCategory)
      : allExposuresFilter;
    
    if (currentFilter !== 'all') {
      if (selectedCategory && selectedCategory !== 'all-exposures') {
        params.set('filter', currentFilter);
      } else {
        params.set('allExposuresFilter', currentFilter);
      }
    }
    
    return params.toString() ? `/categories?${params.toString()}` : '/categories';
  }, [selectedCategory, viewMode, expandedChemical, allExposuresFilter, getCurrentCategoryFilter]);

  // Update URL when state changes (using replace for state updates, but preserve history for navigation)
  useEffect(() => {
    // Skip URL update on initial mount to avoid conflicts
    if (!chemicals.length) return;
    
    const newUrl = buildStateUrl();
    const currentUrl = window.location.pathname + window.location.search;
    
    // Only update if URL actually changed to avoid infinite loops
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

  // Scroll to top when category changes (except on initial mount)
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all-exposures' && chemicals.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory, chemicals.length]);

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

  const categoryGroups = groupChemicalsByCategory(chemicals);
  const categoriesWithStats = getCategoryStats(categoryGroups);

  // Get selected category chemicals and stats
  const selectedCategoryChemicals = selectedCategory && selectedCategory !== 'all-exposures'
    ? sortChemicalsByPercentile(
        filterChemicalsByExposure(
          chemicals.filter(chemical => chemical.exposureCategory === selectedCategory),
          exposureFilter
        )
      )
    : [];
  
  // Get all exposures chemicals and stats
  const allExposuresChemicals = selectedCategory === 'all-exposures'
    ? sortChemicalsByPercentile(
        filterChemicalsByExposure(chemicals, allExposuresFilter)
      )
    : [];
  
  const detectedCount = selectedCategoryChemicals.filter(c => c.value > 0).length;
  const totalCount = selectedCategoryChemicals.length;
  const allExposuresDetectedCount = allExposuresChemicals.filter(c => c.value > 0).length;
  const allExposuresTotalCount = allExposuresChemicals.length;
  const uniqueCategories = new Set(allExposuresChemicals.map(c => c.exposureCategory)).size;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className={`mx-auto py-8 max-w-7xl w-[calc(100%-2rem)] transition-all duration-500 ${
        selectedCategory && selectedCategory !== 'all-exposures' 
          ? 'pl-8 pr-0' 
          : 'px-8'
      }`}>
        <div className={`flex items-start relative transition-all duration-500 ease-in-out ${
          selectedCategory && selectedCategory !== 'all-exposures' 
            ? 'gap-8' 
            : 'gap-0'
        }`}>
          {/* Main Content Area - Left */}
          <div className="flex-1 transition-all duration-500 ease-in-out min-w-0">
            {!selectedCategory ? (
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Health Categories</h1>
                <p className="text-gray-600 mt-2">Detailed view of all health categories and their chemical exposures</p>
              </div>
            ) : selectedCategory === 'all-exposures' ? (
              <div>
                <div className="mb-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">All Chemical Exposures</h1>
                      <p className="text-gray-600">Viewing all chemicals across all categories</p>
                      <p className="text-sm text-gray-500 mt-1">Detected {allExposuresDetectedCount}/{allExposuresTotalCount} exposures</p>
                    </div>
                    <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
                      <span className="text-sm font-medium text-gray-900">
                        {chemicals.length} total chemicals
                      </span>
                    </div>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center gap-2 mb-6">
                    <button
                      onClick={() => setViewMode('overview')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        viewMode === 'overview'
                          ? 'bg-teal-600 text-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setViewMode('chemicals')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        viewMode === 'chemicals'
                          ? 'bg-teal-600 text-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      Chemical List
                    </button>
                  </div>
                </div>

                {/* Overview Section */}
                {viewMode === 'overview' && (
                  <AllChemicalsOverview 
                    data={getAllChemicalsOverview()} 
                    onCategoryClick={(category) => setSelectedCategory(category)}
                    categoryStats={categoriesWithStats.map(({ category, detectedCount, totalCount }) => ({
                      category,
                      detectedCount,
                      totalCount
                    }))}
                  />
                )}

                {/* Chemical List Section */}
                {viewMode === 'chemicals' && (
                  <div className="mb-8">
                    <div className="flex items-center justify-end mb-6">
                      <ExposureFilterButtons 
                        currentFilter={allExposuresFilter}
                        onFilterChange={setAllExposuresFilter}
                      />
                    </div>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-[#1a2540]">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white">
                          <div className="col-span-3 min-w-0 truncate">Chemical Name</div>
                          <div className="col-span-2 min-w-0 truncate">Category</div>
                          <div className="col-span-2 text-center min-w-0 truncate">Measured Value</div>
                          <div className="col-span-1 text-center min-w-0">%ile</div>
                          <div className="col-span-2 min-w-0 truncate">Source</div>
                          <div className="col-span-2 min-w-0 truncate">Status</div>
                        </div>
                      </div>
                      <div>
                        {allExposuresChemicals.map((chemical, index) => {
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
                                  <div className="col-span-3 flex items-center gap-2">
                                    <svg 
                                      className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-900 truncate">
                                      {chemical.compound}
                                    </span>
                                  </div>
                                  <div className="col-span-2 min-w-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategory(chemical.exposureCategory);
                                      }}
                                      className="text-sm text-[#1a2540] hover:text-[#1a2540]/80 hover:underline truncate block transition-colors text-left w-full max-w-full"
                                    >
                                      {chemical.exposureCategory}
                                    </button>
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
                                  href={`/chemical/${encodeURIComponent(chemical.compound)}`}
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
                  </div>
                )}
                
                {viewMode === 'chemicals' && (
                  <div className="text-sm text-gray-500 text-center">
                    Showing {allExposuresChemicals.length} chemicals across {uniqueCategories} categories
                    {allExposuresFilter !== 'all' && (
                      <span className="ml-2">
                        (filtered by {allExposuresFilter.replace('-', ' ')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
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
                          ? 'bg-teal-600 text-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setViewMode('details')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        viewMode === 'details'
                          ? 'bg-teal-600 text-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setViewMode('chemicals')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        viewMode === 'chemicals'
                          ? 'bg-teal-600 text-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      Chemical List
                    </button>
                  </div>
                </div>

                {/* Overview Section */}
                {viewMode === 'overview' && selectedCategory && selectedCategory !== 'all-exposures' && (
                  <CategoryOverviewDashboard
                    categoryName={selectedCategory}
                    chemicals={chemicals.filter(chemical => chemical.exposureCategory === selectedCategory)}
                    allCategories={chemicals}
                  />
                )}

                {/* Details Section */}
                {viewMode === 'details' && selectedCategory && selectedCategory !== 'all-exposures' && (() => {
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
                          if (selectedCategory && selectedCategory !== 'all-exposures') {
                            updateCategoryFilter(selectedCategory, filter);
                          }
                        }}
                      />
                    </div>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-[#1a2540]">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white">
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
                                  href={`/chemical/${encodeURIComponent(chemical.compound)}`}
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
            )}
          </div>

          {/* Categories List - Right Side (slides out smoothly when viewing all exposures) */}
          <div 
            className={`transition-all duration-500 ease-in-out flex-shrink-0 ${
              selectedCategory && selectedCategory !== 'all-exposures' 
                ? 'w-80 min-w-80 translate-x-0 opacity-100 ml-8' 
                : 'w-0 min-w-0 max-w-0 translate-x-full opacity-0 pointer-events-none overflow-hidden'
            }`}
          >
            <div className="space-y-3">
              {/* View All Exposures Card */}
              <button
                onClick={() => setSelectedCategory('all-exposures')}
                className="block w-full text-left"
              >
                <div className={`bg-teal-600 hover:bg-teal-700 border border-teal-500 rounded-lg p-4 transition-all duration-300 cursor-pointer`}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-gray-900 truncate flex-1 mr-2">View All Exposures</h2>
                    <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <p className="text-xs text-teal-100">All chemicals across categories</p>
                </div>
              </button>

              {/* Category Cards */}
              {categoriesWithStats.map(({ category, chemicals, detectedCount, totalCount }) => {
                const status = getCategoryStatusInfo(chemicals);
                const isActive = selectedCategory === category;
                
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="block w-full text-left"
                  >
                     <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:border-[#1a2540] hover:shadow-lg hover:shadow-[#1a2540]/20 transition-all duration-300 cursor-pointer ${
                      isActive ? '-translate-x-4' : ''
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold text-gray-900 truncate flex-1 mr-2">{category}</h2>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${status.bgColor} ${status.textColor}`}>
                          {status.text}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">Detected {detectedCount}/{totalCount}</p>
                    </div>
                  </button>
                );
              })}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
