'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTest } from '@/contexts/TestContext';
import { formatTestDate } from '@/lib/date-utils';
import { TestMetadata, ChemicalData } from '@/app/api/csv-parser';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { groupChemicalsByCategory, getCategoryStats, getCategoryStatusInfo, sortChemicalsByPercentile, getChemicalStatusInfo } from '@/app/api/utils';
import { getAllCategoryNames, findCategoryOverview } from '@/data/category-overviews';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LabelList } from 'recharts';
import { getCategoryIcon } from '@/lib/category-icons';

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [month, day, year] = dateStr.split('/');
    const date = new Date(parseInt(year) + 2000, parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}



export default function DashboardPage() {
  const { selectedTest, availableTests, setSelectedTest } = useTest();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [chartData, setChartData] = useState<Array<{date: string; detectionRate: number; totalDetected: number; totalChemicals: number}>>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [trendType, setTrendType] = useState<'exposure' | 'category'>('category');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [isHelpBannerVisible, setIsHelpBannerVisible] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const currentTest = availableTests.find(test => test.id === selectedTest);
  const currentDate = currentTest?.date ? formatMonthYear(currentTest.date) : 'Select test';

  // Load chemicals data
  useEffect(() => {
    async function loadChemicals() {
      try {
        const data = await parseChemicalsCSV(selectedTest);
        setChemicals(data);
      } catch (error) {
        console.error('Error loading chemicals:', error);
      }
    }
    loadChemicals();
  }, [selectedTest]);

  // Load chart data for all tests
  useEffect(() => {
    async function loadChartData() {
      try {
        setChartLoading(true);
        const allTestsData: ChemicalData[][] = [];
        
        // Load data from all tests
        for (let testId = 1; testId <= 4; testId++) {
          try {
            const data = await parseChemicalsCSV(testId);
            allTestsData.push(data);
          } catch (error) {
            console.error(`Error loading test ${testId}:`, error);
          }
        }

        // Calculate detection rate for each test
        const chartDataPoints = [];
        for (let testId = 1; testId <= allTestsData.length; testId++) {
          const testData = allTestsData[testId - 1];
          if (!testData || testData.length === 0) continue;
          
          const testMeta = availableTests.find(t => t.id === testId);
          const testDate = testMeta?.date || '';
          
          const detectedCount = testData.filter(c => c.value > 0).length;
          const totalCount = testData.length;
          const detectionRate = totalCount > 0 ? (detectedCount / totalCount) * 100 : 0;
          
          chartDataPoints.push({
            date: testDate ? formatMonthYear(testDate) : `Test ${testId}`,
            fullDate: testDate,
            detectionRate: Math.round(detectionRate),
            totalDetected: detectedCount,
            totalChemicals: totalCount,
            testId: testId
          });
        }

        // Sort by test ID (which should be chronological)
        chartDataPoints.sort((a, b) => a.testId - b.testId);
        setChartData(chartDataPoints);
      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setChartLoading(false);
      }
    }
    
    loadChartData();
  }, [availableTests]);

  // Filter chemicals based on search query
  const filteredResults = searchQuery.trim()
    ? chemicals
        .filter(chemical =>
          chemical.compound.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10)
    : [];

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearchOpen(value.trim().length > 0 && filteredResults.length > 0);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0 && filteredResults.length > 0) {
      setIsSearchOpen(true);
    }
  };

  const handleSelect = (chemical: ChemicalData) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setHighlightedIndex(-1);
    router.push(`/chemical/${encodeURIComponent(chemical.compound)}?from=dashboard`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || filteredResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim().length > 0) {
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredResults.length) {
          handleSelect(filteredResults[highlightedIndex]);
        } else if (filteredResults.length > 0) {
          handleSelect(filteredResults[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsSearchOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 pb-8">
        <h1 className="text-xl lg:text-2xl font-bold text-black mb-2">Welcome back, <span>Danny</span></h1>
        <div className="h-px bg-gray-300 mb-2"></div>
        
        {/* Test Selection Dropdown and Search Bar Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Test Selection Dropdown */}
          <div className="relative w-full lg:w-auto">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full lg:w-auto bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg 
                className="w-4 h-4 text-gray-500"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{currentDate}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                  {availableTests.map((test) => (
                    <button
                      key={test.id}
                      onClick={() => {
                        setSelectedTest(test.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        test.id === selectedTest ? 'bg-[#9CBB04]/10 text-[#9CBB04] font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {test.date ? formatMonthYear(test.date) : `Test ${test.id}`}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="relative w-full lg:flex-1 lg:max-w-sm">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                placeholder="Search all exposures..."
                className="w-full px-4 py-1.5 pl-10 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#9CBB04] focus:border-[#9CBB04] transition-all shadow-sm hover:border-[#9CBB04]/50"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && filteredResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-[#9CBB04]/30 rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredResults.map((chemical, index) => (
                  <button
                    key={`${chemical.compound}-${index}`}
                    type="button"
                    onClick={() => handleSelect(chemical)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      highlightedIndex === index
                        ? 'bg-[#9CBB04] text-white'
                        : 'text-gray-900 hover:bg-[#9CBB04]/10 hover:text-[#8AA803]'
                    }`}
                  >
                    <div className="font-medium">{chemical.compound}</div>
                    <div className={`text-xs mt-0.5 ${
                      highlightedIndex === index ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {chemical.exposureCategory}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {isSearchOpen && searchQuery.trim().length > 0 && filteredResults.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-[#9CBB04]/30 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                No chemicals found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>

        {/* Three Blank Cards */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-[120px] px-4 lg:px-6 py-3 flex flex-col overflow-hidden">
            {chemicals.length > 0 && (() => {
              const detectedCount = chemicals.filter(c => c.value > 0).length;
              const totalCount = chemicals.length;
              const detectionRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
              
              return (
                <>
                  <div className="text-xs lg:text-sm font-bold text-gray-700 mb-2 flex-shrink-0">Exposures Detected</div>
                  <div className="h-px bg-gray-200 mb-2"></div>
                  <div className="flex-1 flex flex-col justify-center gap-1 min-h-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl lg:text-4xl font-bold text-[#9CBB04] leading-none">{detectedCount}</span>
                      <span className="text-xs lg:text-sm text-gray-500">of {totalCount} chemicals</span>
                    </div>
                    <div className="w-full">
                      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#9CBB04] transition-all duration-700 ease-out rounded-full"
                          style={{ width: `${detectionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <Link 
            href={chemicals.length > 0 ? (() => {
              const categoryGroups = groupChemicalsByCategory(chemicals);
              const categoriesWithStats = getCategoryStats(categoryGroups);
              const topCategory = categoriesWithStats.length > 0
                ? categoriesWithStats.reduce((prev, current) => 
                    current.detectedCount > prev.detectedCount ? current : prev
                  )
                : null;
              return topCategory && topCategory.detectedCount > 0
                ? `/categories?category=${encodeURIComponent(topCategory.category)}`
                : '#';
            })() : '#'}
            className="bg-white border border-gray-200 rounded-xl shadow-sm h-[120px] px-4 lg:px-6 py-3 flex flex-col overflow-hidden relative hover:border-[#9CBB04] hover:shadow-md transition-all cursor-pointer"
          >
            {chemicals.length > 0 && (() => {
              const categoryGroups = groupChemicalsByCategory(chemicals);
              const categoriesWithStats = getCategoryStats(categoryGroups);
              
              // Find the top category by detected count
              const topCategory = categoriesWithStats.length > 0
                ? categoriesWithStats.reduce((prev, current) => 
                    current.detectedCount > prev.detectedCount ? current : prev
                  )
                : null;
              
              if (!topCategory || topCategory.detectedCount === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-xs lg:text-sm font-bold text-gray-700 mb-1">Top Exposure Category</div>
                    <div className="text-xs text-gray-500">No exposures detected</div>
                  </div>
                );
              }
              
              const statusInfo = getCategoryStatusInfo(topCategory.chemicals);
              const detectionRate = topCategory.totalCount > 0 
                ? Math.round((topCategory.detectedCount / topCategory.totalCount) * 100) 
                : 0;
              
              return (
                <>
                  <div className="text-xs lg:text-sm font-bold text-gray-700 mb-2 flex-shrink-0">Top Exposure Category</div>
                  <div className="h-px bg-gray-200 mb-2"></div>
                  <div className="flex-1 flex items-start gap-2 lg:gap-3 min-h-0">
                    <div className="bg-[#9CBB04]/20 p-2 lg:p-3 rounded-lg text-[#9CBB04] flex-shrink-0">
                      <div className="scale-75 lg:scale-100">
                        {getCategoryIcon(topCategory.category, 'w-8 h-8')}
                      </div>
                    </div>
                    <div className="w-px h-full bg-gray-200 flex-shrink-0"></div>
                    <div className="flex flex-col justify-start gap-0.5 min-h-0">
                      <div className="text-base lg:text-lg font-semibold text-gray-900">
                        {topCategory.category}
                      </div>
                      <div className="flex items-center gap-1.5 lg:gap-2 text-xs text-gray-600">
                        <span>{topCategory.detectedCount} chemicals</span>
                        <span className="text-gray-400">|</span>
                        <span>{detectionRate}% detection rate</span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </Link>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm h-[120px] px-4 lg:px-6 py-3 flex flex-col overflow-hidden">
            {chemicals.length > 0 && (() => {
              const detectedChemicals = chemicals.filter(c => c.value > 0);
              const sortedChemicals = sortChemicalsByPercentile(detectedChemicals);
              const top3Chemicals = sortedChemicals.slice(0, 3);
              
              if (top3Chemicals.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-xs lg:text-sm font-semibold text-gray-700 mb-1">Top 3 Exposures</div>
                    <div className="text-xs text-gray-500">No exposures detected</div>
                  </div>
                );
              }
              
              return (
                <>
                  <div className="text-xs lg:text-sm font-bold text-gray-700 mb-2 flex-shrink-0">Top 3 Highest Exposures</div>
                  <div className="h-px bg-gray-200 mb-2"></div>
                  <div className="flex-1 flex flex-col gap-0.1 min-h-0">
                    {top3Chemicals.map((chemical, index) => {
                      const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
                      
                      return (
                        <div 
                          key={chemical.compound}
                          className="flex items-center justify-between gap-2 group cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded transition-colors flex-shrink-0"
                          onClick={() => router.push(`/chemical/${encodeURIComponent(chemical.compound)}?from=dashboard`)}
                        >
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.color} flex-shrink-0`}></div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-medium text-gray-900 truncate">
                                {chemical.compound}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className={`text-[11px] font-medium ${statusInfo.textColor}`}>
                              {chemical.value > 0 
                                ? `${chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL`
                                : 'N/D'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Full Width Card */}
        <div className="mt-4 w-full bg-white border border-gray-200 rounded-xl shadow-sm pt-3 pb-4 px-6 relative">
          {/* Detection Overview (Second) */}
          {chemicals.length > 0 && (() => {
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
              };
            }).sort((a, b) => {
              // Sort by detected count (descending), then by name
              if (b.detectedCount !== a.detectedCount) {
                return b.detectedCount - a.detectedCount;
              }
              return a.name.localeCompare(b.name);
            });

            const CustomTooltip = ({ active, payload }: any) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                if (trendType === 'exposure') {
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                      <p className="text-gray-900 font-semibold mb-2">{data.fullDate || data.date}</p>
                      <p className="text-[#9CBB04]">
                        <span className="text-gray-600">Detection Rate: </span>
                        {data.detectionRate}%
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {data.totalDetected} of {data.totalChemicals} detected
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                      <p className="text-gray-900 font-semibold mb-2">{data.name}</p>
                      <p className="text-[#9CBB04]">
                        <span className="text-gray-600">Detected: </span>
                        {data.detectedCount}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        {data.totalCount} total chemicals
                      </p>
                    </div>
                  );
                }
              }
              return null;
            };

            // Prepare category trend data (ascending order by detected count)
            const categoryTrendData = allCategories
              .map(category => ({
                name: category.name,
                detectedCount: category.detectedCount,
                totalCount: category.totalCount,
              }))
              .sort((a, b) => a.detectedCount - b.detectedCount)
              .map((item, index) => ({ ...item, index }));

            return (
              <div className="px-0.1">
                {/* Header in top left corner */}
                <div className="absolute top-5 left-6 z-10">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {trendType === 'category' ? 'Exposures by Category' : 'Exposures Over Time'}
                    </h3>
                    {trendType === 'category' && (
                      <>
                        <div className="h-4 w-px bg-gray-300 translate-y-1"></div>
                        <Link href="/categories" className="text-[#9CBB04] text-sm hover:underline inline-flex items-center gap-1">
                          Learn more
                          <span className="text-[#9CBB04]">›</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                {/* Toggle in top right corner */}
                <div className="absolute top-3 right-6 z-10">
                  <div className="bg-gray-100 rounded p-1 shadow-sm flex gap-0.5 relative">
                    {/* Sliding indicator */}
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded-sm bg-white border border-[#9CBB04] transition-all duration-300 ease-in-out"
                      style={{
                        width: 'calc(50% - 0.125rem)',
                        left: trendType === 'category' ? '0.125rem' : 'calc(50% + 0.125rem)'
                      }}
                    />
                    <button
                      onClick={() => setTrendType('category')}
                      className="flex-1 px-3 py-1 rounded-sm text-xs font-medium relative z-10 transition-colors whitespace-nowrap"
                      style={{
                        color: trendType === 'category' ? '#9CBB04' : '#4b5563'
                      }}
                    >
                      Category Trend
                    </button>
                    <button
                      onClick={() => setTrendType('exposure')}
                      className="flex-1 px-3 py-1 rounded-sm text-xs font-medium relative z-10 transition-colors whitespace-nowrap"
                      style={{
                        color: trendType === 'exposure' ? '#9CBB04' : '#4b5563'
                      }}
                    >
                      Exposure Trend
                    </button>
                  </div>
                </div>
                
                <div className="pt-10">
                  <div className="h-px bg-gray-300 mb-4"></div>
                {chartLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9CBB04]"></div>
                  </div>
                ) : trendType === 'exposure' && chartData.length > 0 ? (
                  <div 
                    className="outline-none focus:outline-none [&_svg]:outline-none [&_svg]:focus:outline-none [&_*]:outline-none [&_*]:focus:outline-none" 
                    tabIndex={-1}
                    style={{ outline: 'none !important' }}
                    onFocus={(e) => (e.target as HTMLElement).blur()}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ResponsiveContainer width="100%" height={250} style={{ outline: 'none' }}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDetection" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#9CBB04" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#9CBB04" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="basis"
                          dataKey="detectionRate"
                          stroke="#9CBB04"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorDetection)"
                        />
                        <Line
                          type="basis"
                          dataKey="detectionRate"
                          stroke="#9CBB04"
                          strokeWidth={2}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            const isSelected = payload?.testId === selectedTest;
                            
                            if (isSelected) {
                              // Render a larger, highlighted marker for selected test
                              return (
                                <g>
                                  {/* Outer ring */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={8}
                                    fill="white"
                                    stroke="#9CBB04"
                                    strokeWidth={3}
                                  />
                                  {/* Inner dot */}
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={5}
                                    fill="#9CBB04"
                                  />
                                  {/* Label */}
                                  <text
                                    x={cx - 65}
                                    y={cy - 15}
                                    textAnchor="middle"
                                    fill="#9CBB04"
                                    fontSize={12}
                                    fontWeight="600"
                                    className="pointer-events-none"
                                  >
                                    Currently Selected
                                  </text>
                                </g>
                              );
                            }
                            
                            // Regular dot for non-selected tests
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill="#9CBB04"
                                opacity={0.6}
                              />
                            );
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : trendType === 'category' && categoryTrendData.length > 0 ? (
                  <div 
                    className="outline-none focus:outline-none [&_svg]:outline-none [&_svg]:focus:outline-none [&_*]:outline-none [&_*]:focus:outline-none" 
                    tabIndex={-1}
                    style={{ outline: 'none !important' }}
                    onFocus={(e) => (e.target as HTMLElement).blur()}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <ResponsiveContainer width="100%" height={250} style={{ outline: 'none' }}>
                      <BarChart 
                        data={categoryTrendData} 
                        margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
                        barCategoryGap="1%"
                        style={{ outline: 'none' }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis 
                          dataKey="name"
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280', fontSize: 14 }}
                          tickLine={false}
                          interval={0}
                          tickFormatter={(value: string) => {
                            // Force category names onto two lines
                            const words = value.split(' ');
                            if (words.length <= 1) {
                              return value;
                            }
                            
                            // Split words roughly in half
                            const midPoint = Math.ceil(words.length / 2);
                            const line1 = words.slice(0, midPoint).join(' ');
                            const line2 = words.slice(midPoint).join(' ');
                            
                            return `${line1}\n${line2}`;
                          }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar 
                          dataKey="detectedCount" 
                          radius={[4, 4, 0, 0]}
                          shape={(props: any) => {
                            const { x, y, width, height, payload, index } = props;
                            
                            // Calculate color based on index
                            const maxIndex = categoryTrendData.length - 1;
                            const barIndex = index !== undefined ? index : (payload ? categoryTrendData.findIndex((item: any) => item.name === payload.name) : 0);
                            const lightnessFactor = maxIndex > 0 ? 0.3 + (barIndex / maxIndex) * 0.7 : 1.0;
                            
                            const baseR = 156;
                            const baseG = 187;
                            const baseB = 4;
                            
                            const lightR = Math.round(baseR + (255 - baseR) * (1 - lightnessFactor));
                            const lightG = Math.round(baseG + (255 - baseG) * (1 - lightnessFactor));
                            const lightB = Math.round(baseB + (255 - baseB) * (1 - lightnessFactor));
                            
                            const color = `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
                            
                            const xNum = typeof x === 'number' ? x : Number(x) || 0;
                            const yNum = typeof y === 'number' ? y : Number(y) || 0;
                            const widthNum = typeof width === 'number' ? width : Number(width) || 0;
                            const heightNum = typeof height === 'number' ? height : Number(height) || 0;
                            
                            // Check if this bar is hovered
                            const isHovered = hoveredBarIndex === barIndex;
                            // Increase height by 10% when hovered
                            const adjustedHeight = isHovered ? heightNum * 1.1 : heightNum;
                            const adjustedY = isHovered ? yNum - (heightNum * 0.1) : yNum;
                            
                            return (
                              <g>
                                <rect
                                  x={xNum}
                                  y={adjustedY}
                                  width={widthNum}
                                  height={adjustedHeight}
                                  fill={color}
                                  rx={4}
                                  ry={4}
                                  onMouseEnter={() => setHoveredBarIndex(barIndex)}
                                  onMouseLeave={() => setHoveredBarIndex(null)}
                                  style={{ 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                />
                                {/* Label on top */}
                                {payload && (
                                  <text
                                    x={xNum + widthNum / 2}
                                    y={adjustedY - 8}
                                    fill={color}
                                    textAnchor="middle"
                                    fontSize={24}
                                    fontWeight="900"
                                    style={{ pointerEvents: 'none' }}
                                  >
                                    {payload.detectedCount}
                                  </text>
                                )}
                              </g>
                            );
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-gray-600 py-8">
                    <p>No data available</p>
                  </div>
                )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Category Cards Grid */}
        {chemicals.length > 0 && (() => {
          const categoryGroups = groupChemicalsByCategory(chemicals);
          const categoriesWithStats = getCategoryStats(categoryGroups);
          const allCategoryNames = getAllCategoryNames();

          // Create a map of category stats for quick lookup
          const categoryStatsMap = new Map(
            categoriesWithStats.map(stat => [stat.category, stat])
          );

          // Get top 6 categories sorted by detected count
          const topCategories = allCategoryNames
            .map(categoryName => {
              const stats = categoryStatsMap.get(categoryName);
              const categoryChemicals = stats?.chemicals || [];
              const statusInfo = getCategoryStatusInfo(categoryChemicals);
              
              return {
                name: categoryName,
                detectedCount: stats?.detectedCount || 0,
                totalCount: stats?.totalCount || 0,
                classification: statusInfo.text,
                classificationColor: statusInfo.textColor,
              };
            })
            .sort((a, b) => b.detectedCount - a.detectedCount)
            .slice(0, 6);

          return (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-2">
              {topCategories.map((category) => (
                <Link
                  key={category.name}
                  href={`/categories?category=${encodeURIComponent(category.name)}`}
                  className="bg-white border border-gray-200 rounded-xl px-3 lg:px-4 py-3 shadow-sm relative min-h-[60px] flex items-center hover:border-[#9CBB04] hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 lg:gap-3 pr-2 flex-1">
                    <div className="text-[#9CBB04] flex-shrink-0 w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center">
                      <div className="scale-75 lg:scale-100">
                        {getCategoryIcon(category.name, 'w-8 h-8')}
                      </div>
                    </div>
                    <div className="text-sm lg:text-base font-bold text-gray-900">
                      {category.name}
                    </div>
                  </div>
                  <div className="absolute top-2 lg:top-3 right-2 lg:right-4">
                    <div className={`text-xs font-medium ${category.classificationColor} whitespace-nowrap`}>
                      {category.classification}
                    </div>
                  </div>
                  <div className="absolute bottom-2 lg:bottom-3 right-2 lg:right-4">
                    <div className="text-xs font-normal text-gray-500">
                      {category.detectedCount} / {category.totalCount} elevated
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          );
        })()}

        {/* Help Banner */}
        {isHelpBannerVisible && (
          <div className="mt-8 bg-[#9CBB04]/10 border border-[#9CBB04]/30 rounded-xl px-4 lg:px-6 py-4 relative">
            <button
              onClick={() => setIsHelpBannerVisible(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pr-8 gap-3 lg:gap-0">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#9CBB04] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Need help understanding your data?</p>
                  <p className="text-xs text-gray-600 mt-0.5">Get a breakdown of your exposure data and learn how to interpret the results.</p>
                </div>
              </div>
              <Link
                href="/help"
                className="px-4 py-2 bg-[#9CBB04] text-white text-sm font-medium rounded-lg hover:bg-[#8AA803] transition-colors whitespace-nowrap w-full lg:w-auto text-center"
              >
                Help Center
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
