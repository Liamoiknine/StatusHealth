'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { useTest } from '@/contexts/TestContext';
import { groupChemicalsByCategory, getCategoryStats, getChemicalStatusInfo, filterChemicalsByExposure, sortChemicalsByPercentile, ExposureFilterType, formatPercentile, getPercentileColor } from '@/app/api/utils';
import { findCategoryOverview, getAllCategoryNames } from '@/data/category-overviews';
import { ChemicalData } from '@/app/api/csv-parser';
import CategoryCard from '@/components/CategoryCard';
import CategoryOverviewDashboard from '@/components/CategoryOverviewDashboard';
import CategoryOverview from '@/components/CategoryOverview';
import ExposureFilterButtons from '@/components/ExposureFilterButtons';
import ChemicalSearchBar from '@/components/ChemicalSearchBar';
import Link from 'next/link';
import React, { useRef } from 'react';

// Category icon mapping
function getCategoryIcon(categoryName: string) {
  const iconMap: Record<string, React.ReactElement> = {
    'Agricultural Chemicals': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
      </svg>
    ),
    'Containers & Coatings': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/>
        <path d="M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/>
        <path d="M3 7h18"/>
        <path d="M7 7v10"/>
        <path d="M17 7v10"/>
      </svg>
    ),
    'Household Products': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    'Industrial Chemicals': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    'Persistent Pollutants': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2v2"/>
        <path d="M12 20v2"/>
        <path d="M4 12H2"/>
        <path d="M22 12h-2"/>
        <path d="m15.536 15.536 1.414 1.414"/>
        <path d="m7.05 7.05-1.414-1.414"/>
        <path d="m15.536 8.464 1.414-1.414"/>
        <path d="m7.05 16.95-1.414 1.414"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    ),
    'Personal Care Products': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
      </svg>
    ),
  };

  return iconMap[categoryName] || (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

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
  const chemicalRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
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
    
    // Restore filters from URL - but default to 'all' for chemicals view
    const filterParam = searchParams.get('filter');
    if (filterParam && categoryParam) {
      const validFilters: ExposureFilterType[] = ['all', 'pay-attention', 'monitor-only', 'low-exposure', 'not-detected'];
      if (validFilters.includes(filterParam as ExposureFilterType)) {
        setCategoryFilters({ [decodeURIComponent(categoryParam)]: filterParam as ExposureFilterType });
      }
    } else if (categoryParam) {
      // Default to 'all' if no filter is specified
      setCategoryFilters({ [decodeURIComponent(categoryParam)]: 'all' });
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
      // Ensure filter defaults to 'all' if not set
      setCategoryFilters(prev => {
        if (!prev[selectedCategory]) {
          return {
            ...prev,
            [selectedCategory]: 'all'
          };
        }
        return prev;
      });
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
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9CBB04] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  const categoryGroups = groupChemicalsByCategory(chemicals);
  const categoriesWithStats = getCategoryStats(categoryGroups);
  const allCategoryNames = getAllCategoryNames();

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

  // Get all chemicals for the selected category (unfiltered) for total counts
  const allCategoryChemicals = selectedCategory
    ? chemicals.filter(chemical => chemical.exposureCategory === selectedCategory)
    : [];
  
  // Calculate total counts (unfiltered) - always use these for overview page
  const totalDetectedCount = allCategoryChemicals.filter(c => c.value > 0).length;
  const totalCategoryCount = allCategoryChemicals.length;
  
  // Get selected category chemicals and stats (filtered for chemicals list view)
  const selectedCategoryChemicals = selectedCategory
    ? sortChemicalsByPercentile(
        filterChemicalsByExposure(
          allCategoryChemicals,
          exposureFilter
        )
      )
    : [];
  
  // Use total counts for display (overview always shows totals)
  const detectedCount = totalDetectedCount;
  const totalCount = totalCategoryCount;

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

  // Show category cards grid when no category is selected
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-3">Chemical Exposure Categories</h1>
            <p className="text-base lg:text-lg text-gray-600 max-w-3xl">
              Explore the six major categories of chemical exposures to understand their sources, 
              exposure pathways, and your individual exposure levels based on your test results.
            </p>
          </div>

          {/* Category Cards Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
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

          {/* Learn More Section */}
          <div className="bg-gradient-to-r from-[#404B69] to-[#404B69]/90 rounded-lg p-4 lg:p-6 mb-8 text-white">
            <h2 className="text-lg lg:text-xl font-semibold mb-3 flex items-center">
              <Link href="/help" className="hover:opacity-80 transition-opacity">
                <svg className="w-5 h-5 mr-2 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
              Understanding Categories
            </h2>
            <p className="text-white/90 mb-4 text-sm lg:text-base">
              Chemicals are organized into six categories based on their primary sources, uses, and exposure pathways. 
              This structure helps you understand not just what chemicals are present, but where they come from and 
              how they enter your body.
            </p>
            <p className="text-white/80 text-xs lg:text-sm">
              Each category includes detailed information about exposure pathways, health implications, and regulatory context. 
              Click on any category card above to explore detailed insights about your exposure levels.
            </p>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Data based on test results. For detailed information about individual chemicals, 
              visit the{' '}
              <Link href="/" className="text-[#404B69] hover:text-[#9CBB04] underline">
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
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto py-8 max-w-7xl px-4 lg:px-8">
        <div className="flex items-start relative">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div>
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between mb-6 gap-4">
                  <div>
                    <div className="flex items-center gap-2 lg:gap-3 mb-2">
                      <div className="bg-[#9CBB04]/20 p-2 rounded-lg text-[#9CBB04] flex-shrink-0">
                        {getCategoryIcon(selectedCategory)}
                      </div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{selectedCategory}</h1>
                    </div>
                    <p className="text-sm lg:text-base text-gray-600">Detected {detectedCount}/{totalCount} exposures</p>
                  </div>
                  <div className="bg-white border border-gray-200 px-3 lg:px-4 py-2 rounded-lg">
                    <span className="text-xs lg:text-sm font-medium text-gray-900">
                      {totalCount} chemicals
                    </span>
                  </div>
                </div>
                
                    {/* View Toggle */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      <button
                        onClick={() => setViewMode('overview')}
                        className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-colors ${
                          viewMode === 'overview'
                            ? 'bg-[#9CBB04] text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setViewMode('details')}
                        className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-colors ${
                          viewMode === 'details'
                            ? 'bg-[#9CBB04] text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setViewMode('chemicals')}
                        className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-xs lg:text-sm transition-colors ${
                          viewMode === 'chemicals'
                            ? 'bg-[#9CBB04] text-white'
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
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between mb-6 gap-4">
                    <ExposureFilterButtons 
                      currentFilter={exposureFilter}
                      onFilterChange={(filter) => {
                        if (selectedCategory) {
                          updateCategoryFilter(selectedCategory, filter);
                        }
                      }}
                    />
                    <ChemicalSearchBar
                      chemicals={selectedCategoryChemicals}
                      onSelect={handleChemicalSelect}
                    />
                  </div>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px]">
                        <div className="px-4 lg:px-6 py-4 bg-[#404B69]">
                          <div className="grid grid-cols-12 gap-2 lg:gap-4 text-xs lg:text-sm font-medium text-white">
                            <div className="col-span-3">Chemical Name</div>
                            <div className="col-span-2 text-center">Measured Value</div>
                            <div className="col-span-1 text-center">Percentile</div>
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
                              <div
                                key={index}
                                ref={(el) => {
                                  chemicalRefs.current[chemical.compound] = el;
                                }}
                              >
                                {/* Clickable Row */}
                                <div
                                  onClick={() => setExpandedChemical(isExpanded ? null : chemical.compound)}
                                  className={`px-4 lg:px-6 py-3.5 transition-all duration-200 cursor-pointer ${
                                    isExpanded 
                                      ? 'bg-gray-100' 
                                      : isEven 
                                        ? 'bg-white hover:bg-gray-50' 
                                        : 'bg-gray-50 hover:bg-gray-100'
                                  }`}
                                >
                                  <div className="grid grid-cols-12 gap-2 lg:gap-4 items-center">
                                    <div className="col-span-3 flex items-center gap-2">
                                      <svg 
                                        className={`w-4 h-4 text-[#9CBB04] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                      <Link 
                                        href={`/chemical/${encodeURIComponent(chemical.compound)}?from=categories`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs lg:text-sm font-semibold text-gray-900 hover:text-[#9CBB04] truncate block transition-colors"
                                      >
                                        {chemical.compound}
                                      </Link>
                                    </div>
                                    <div className="col-span-2 text-center">
                                      <span className="text-xs lg:text-sm text-gray-700">
                                        {chemical.value > 0 ? `${chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL` : 'Not Detected'}
                                      </span>
                                    </div>
                                    <div className="col-span-1 text-center">
                                      <span className={`text-xs lg:text-sm font-bold ${getPercentileColor(chemical.percentile, chemical.value)}`}>
                                        {formatPercentile(chemical.percentile, chemical.value)}
                                      </span>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-xs lg:text-sm text-gray-600 truncate">
                                        {chemical.primarySource}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <span className={`inline-flex items-center px-2 lg:px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                        {statusInfo.text}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                            
                                {/* Expanded Content */}
                                {isExpanded && (
                                  <Link
                                    href={`/chemical/${encodeURIComponent(chemical.compound)}?from=categories`}
                                    className={`block px-4 lg:px-6 py-4 cursor-pointer transition-colors ${
                                      isEven ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                  >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
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
                                
                                <div className="inline-flex items-center text-[#9CBB04] hover:text-[#9CBB04] transition-colors text-sm font-medium group">
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
                  </div>
                  
                  <div className="text-sm text-gray-500 text-center mt-4">
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Showing <span className="text-[#9CBB04] font-semibold">{selectedCategoryChemicals.length}</span> chemicals in {selectedCategory}
                      {exposureFilter !== 'all' && (
                        <span className="ml-2 text-[#9CBB04]">
                          (filtered by {exposureFilter.replace('-', ' ')})
                        </span>
                      )}
                    </span>
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
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9CBB04] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    }>
      <CategoriesPageContent />
    </Suspense>
  );
}
