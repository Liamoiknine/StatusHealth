'use client';

import { useState, useEffect, useRef } from 'react';
import { useTest } from '@/contexts/TestContext';
import { formatTestDate } from '@/lib/date-utils';
import { TestMetadata, ChemicalData } from '@/app/api/csv-parser';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { useRouter } from 'next/navigation';
import { groupChemicalsByCategory, getCategoryStats, getCategoryStatusInfo } from '@/app/api/utils';
import { getAllCategoryNames } from '@/data/category-overviews';
import DetectionStatusCard from '@/components/dashboard/DetectionStatusCard';
import CategoryListSection from '@/components/dashboard/CategoryListSection';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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


export default function Dashboard2Page() {
  const { selectedTest, availableTests, setSelectedTest } = useTest();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [chartData, setChartData] = useState<Array<{date: string; detectionRate: number; totalDetected: number; totalChemicals: number}>>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [trendType, setTrendType] = useState<'exposure' | 'category'>('exposure');
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
    router.push(`/chemical/${encodeURIComponent(chemical.compound)}?from=dashboard-2`);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
        <h1 className="text-2xl font-bold text-black mb-2">Welcome back, <span className="border-b-4 border-[#9CBB04]">Danny</span></h1>
        <div className="h-px bg-gray-300 mb-2"></div>
        
        {/* Test Selection Dropdown and Search Bar Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Test Selection Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
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
          <div ref={searchRef} className="relative flex-1 max-w-sm">
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-[100px] flex flex-col items-center justify-center pt-2 px-4 pb-4">
            {chemicals.length > 0 && (() => {
              const detectedCount = chemicals.filter(c => c.value > 0).length;
              const totalCount = chemicals.length;
              return (
                <>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-[#9CBB04] leading-none">{detectedCount}</span>
                    <span className="text-xl text-gray-400 ml-1 relative top-1">/</span>
                    <span className="text-xl text-gray-400 ml-0.5 relative top-1">{totalCount}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">exposures detected</div>
                </>
              );
            })()}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-[100px] flex flex-col justify-between pt-2 px-4 pb-4">
            {chemicals.length > 0 && (() => {
              const detectedCount = chemicals.filter(c => c.value > 0).length;
              const totalCount = chemicals.length;
              const detectionRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
              const averageDetectionRate = 35;
              return (
                <>
                  {/* Text above progress bar */}
                  <div className="text-sm text-gray-700 font-medium">
                    Below average exposure
                  </div>
                  
                  {/* Progress bar with average indicator */}
                  <div className="w-full space-y-1">
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
                      {/* Progress fill */}
                      <div 
                        className="h-full bg-[#9CBB04] transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${detectionRate}%` }}
                      />
                      {/* Average detection indicator (vertical dotted line extending above and below) */}
                      {averageDetectionRate > 0 && averageDetectionRate < 100 && (
                        <div 
                          className="absolute"
                          style={{ 
                            left: `${averageDetectionRate}%`,
                            top: '-6px',
                            bottom: '-6px',
                            width: '1px',
                            transform: 'translateX(-50%)',
                            background: 'repeating-linear-gradient(to bottom, #9CA3AF 0px, #9CA3AF 2px, transparent 2px, transparent 4px)'
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span></span>
                      <span>{detectionRate}% detected</span>
                      {averageDetectionRate > 0 && averageDetectionRate < 100 && (
                        <span className="text-gray-400">Avg: {averageDetectionRate}%</span>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-[100px]"></div>
        </div>

        {/* Full Width Card */}
        <div className="mt-4 w-full bg-white border border-gray-200 rounded-lg shadow-sm pt-3 pb-4 px-6 relative">
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
              }
              return null;
            };

            return (
              <div className="px-0.1">
                {/* Toggle in top left corner */}
                <div className="absolute top-3 left-6 z-10">
                  <div className="bg-gray-100 rounded p-1 shadow-sm flex gap-0.5 relative">
                    {/* Sliding indicator */}
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded-sm bg-white border border-[#9CBB04] transition-all duration-300 ease-in-out"
                      style={{
                        width: 'calc(50% - 0.125rem)',
                        left: trendType === 'exposure' ? '0.125rem' : 'calc(50% + 0.125rem)'
                      }}
                    />
                    <button
                      onClick={() => setTrendType('exposure')}
                      className="flex-1 px-3 py-1 rounded-sm text-xs font-medium relative z-10 transition-colors whitespace-nowrap"
                      style={{
                        color: trendType === 'exposure' ? '#9CBB04' : '#4b5563'
                      }}
                    >
                      Exposure Trend
                    </button>
                    <button
                      onClick={() => setTrendType('category')}
                      className="flex-1 px-3 py-1 rounded-sm text-xs font-medium relative z-10 transition-colors whitespace-nowrap"
                      style={{
                        color: trendType === 'category' ? '#9CBB04' : '#4b5563'
                      }}
                    >
                      Category Trend
                    </button>
                  </div>
                </div>
                
                <div className="pt-10">
                  <div className="h-px bg-gray-300 mb-4"></div>
                {chartLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9CBB04]"></div>
                  </div>
                ) : chartData.length > 0 ? (
                  <div>
                    <ResponsiveContainer width="100%" height={250}>
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
                          dot={{ fill: '#9CBB04', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
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
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCategories.map((category) => (
                <div
                  key={category.name}
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm relative min-h-[60px] flex items-center"
                >
                  <div className="text-base font-bold text-gray-900 pr-2 flex-1">
                    {category.name}
                  </div>
                  <div className="absolute top-3 right-4">
                    <div className={`text-xs font-medium ${category.classificationColor} whitespace-nowrap`}>
                      {category.classification}
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-4">
                    <div className="text-xs font-normal text-gray-500">
                      {category.detectedCount} / {category.totalCount} elevated
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
