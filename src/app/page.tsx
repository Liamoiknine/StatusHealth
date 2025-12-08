'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { useTest } from '@/contexts/TestContext';
import { ChemicalData } from '@/app/api/csv-parser';
import OverallExposureSummary from '@/components/dashboard/OverallExposureSummary';
import CategoryComparisonChart from '@/components/dashboard/CategoryComparisonChart';
import CategoryStackedBarChart from '@/components/dashboard/CategoryStackedBarChart';
import TopPriorityChemicals from '@/components/dashboard/TopPriorityChemicals';
import NavigationHub from '@/components/dashboard/NavigationHub';
import ExposureSourceAnalysis from '@/components/category-overview/ExposureSourceAnalysis';
import CategoryCard from '@/components/CategoryCard';
import { groupChemicalsByCategory, getCategoryStats, filterChemicalsByExposure, sortChemicalsByPercentile, getChemicalStatusInfo, getCategoryStatusInfo, formatPercentile, getPercentileColor } from '@/app/api/utils';
import { getAllCategoryNames, findCategoryOverview } from '@/data/category-overviews';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { formatTestDate } from '@/lib/date-utils';
import { EXPOSURE_COLORS } from '@/lib/colors';
import { TestMetadata } from '@/app/api/csv-parser';

function TestDateDropdown({ 
  selectedTest, 
  availableTests, 
  setSelectedTest,
  customButton = false
}: { 
  selectedTest: number; 
  availableTests: TestMetadata[]; 
  setSelectedTest: (id: number) => void;
  customButton?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentTest = availableTests.find(test => test.id === selectedTest);
  const currentDate = currentTest?.date ? formatTestDate(currentTest.date) : 'N/A';

  return (
    <div className="relative">
      {customButton ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-left w-full"
        >
          <p className="text-sm text-gray-300">Viewing results for</p>
          <h2 className="text-xl font-bold text-white underline decoration-teal-400 cursor-pointer">
            {currentDate}
          </h2>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-teal-50 border border-teal-600 text-teal-600 rounded-lg px-4 py-1.5 hover:bg-teal-100 transition-colors font-medium text-sm"
        >
          Change test
        </button>
      )}
      
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
                  test.id === selectedTest ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700'
                }`}
              >
                {test.date ? formatTestDate(test.date) : `Test ${test.id}`}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const DetectionBreakdownChart = memo(function DetectionBreakdownChart({ 
  chemicals, 
  onBarClick 
}: { 
  chemicals: ChemicalData[];
  onBarClick?: (classification: 'pay-attention' | 'monitor-only' | 'low-exposure') => void;
}) {
  const chartData = useMemo(() => {
    const payAttention = filterChemicalsByExposure(chemicals, 'pay-attention').length;
    const monitorOnly = filterChemicalsByExposure(chemicals, 'monitor-only').length;
    const lowExposure = filterChemicalsByExposure(chemicals, 'low-exposure').length;

    return [
      { name: 'Pay Attention', value: payAttention, color: EXPOSURE_COLORS.payAttention, filter: 'pay-attention' as const },
      { name: 'Monitor Only', value: monitorOnly, color: EXPOSURE_COLORS.monitorOnly, filter: 'monitor-only' as const },
      { name: 'Low Exposure', value: lowExposure, color: EXPOSURE_COLORS.lowExposure, filter: 'low-exposure' as const },
    ];
  }, [chemicals]);

  const handleBarClick = useCallback((data: any) => {
    const entry = chartData.find(item => item.name === data.name || item.value === data.value);
    if (entry && onBarClick) {
      onBarClick(entry.filter);
    }
  }, [chartData, onBarClick]);

  return (
    <div className="max-w-md">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 50, right: 30, left: 0, bottom: -10 }}
          barCategoryGap="1%"
        >
        <Bar dataKey="value" radius={[4, 4, 0, 0]} onClick={handleBarClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <LabelList 
            content={(props: any) => {
              const { x, y, width, value, payload } = props;
              // Get the name from payload or find entry by value
              const entry = payload?.name 
                ? chartData.find(item => item.name === payload.name)
                : chartData.find(item => item.value === value);
              const color = entry?.color || '#000000';
              
              return (
                <text
                  x={x + width / 2}
                  y={y - 8}
                  fill={color}
                  textAnchor="middle"
                  fontSize={32}
                  fontWeight="bold"
                >
                  {value}
                </text>
              );
            }} 
          />
        </Bar>
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
        />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
});

function CountUpNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) {
      setCount(value);
      return;
    }
    
    setHasAnimated(true);
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (value - startValue) * easeOutQuart);
      
      setCount(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration, hasAnimated]);

  // Reset animation when value changes
  useEffect(() => {
    setHasAnimated(false);
    setCount(0);
  }, [value]);

  return <>{count}</>;
}

export default function DashboardPage() {
  const { selectedTest, availableTests, setSelectedTest } = useTest();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassification, setSelectedClassification] = useState<'pay-attention' | 'monitor-only' | 'low-exposure' | null>(null);

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
          <p className="text-gray-600">Loading your test results...</p>
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

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '10px 10px'
      }}
    >
      <div className="max-w-7xl mx-auto px-10 sm:px-16 lg:px-20 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold mb-3 tracking-tight leading-none text-teal-600">
            We've got you covered, Danny.
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            View your comprehensive overview of your test results across all {chemicals.length} chemicals and 6 exposure categories
          </p>
        </div>

        {/* Test Selection Section */}
        <div className="mb-10 bg-[#1a2540] rounded-lg p-6 -mt-6 shadow-xl">
          <div className="flex items-center justify-between">
            <TestDateDropdown 
              selectedTest={selectedTest}
              availableTests={availableTests}
              setSelectedTest={setSelectedTest}
              customButton={true}
            />
            <div className="flex items-center gap-3">
              <Link 
                href="/tests"
                className="bg-transparent text-teal-400 border border-teal-400 rounded-lg px-4 py-1.5 hover:bg-teal-400/10 transition-colors font-medium text-sm inline-block"
              >
                View all tests
              </Link>
              <button className="bg-teal-600 text-white rounded-lg px-4 py-1.5 hover:bg-teal-700 transition-colors font-medium text-sm">
                Schedule your next test
              </button>
            </div>
          </div>
        </div>

        {/* Category Stacked Bar Chart Section */}
        <div className="mb-12">
          <CategoryStackedBarChart chemicals={chemicals} />
        </div>

        {/* New Section - Detection Overview */}
        <div className="mb-12 px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
            {/* Left Side */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  <span className="text-3xl text-teal-600">{chemicals.filter(c => c.value > 0).length}</span> chemicals detected
                </h2>
              </div>
              <DetectionBreakdownChart 
                chemicals={chemicals} 
                onBarClick={(classification) => {
                  setSelectedClassification(selectedClassification === classification ? null : classification);
                }}
              />
            </div>

            {/* Right Side */}
            <div className="flex flex-col justify-end">
              <div className="leading-tight">
                <span className="text-6xl lg:text-7xl font-bold text-gray-900">
                  <CountUpNumber 
                    value={chemicals.length > 0 ? Math.round((chemicals.filter(c => c.value > 0).length / chemicals.length) * 100) : 0} 
                    duration={2000}
                  />%
                </span>
                <span className="text-3xl lg:text-4xl font-bold text-teal-600 ml-2">
                  detection rate
                </span>
              </div>
              
              {/* Two clauses with divider */}
              <div className="flex items-center gap-3 mt-4 text-sm lg:text-base text-gray-600">
                <span className="whitespace-nowrap">Out of {chemicals.length} total chemicals</span>
                <div className="h-3 w-px bg-gray-400 flex-shrink-0"></div>
                <span className="whitespace-nowrap">Across {categoriesWithStats.filter(stat => stat.detectedCount > 0).length} exposure categories</span>
              </div>
              
              {/* Full width clause below */}
              <div className="mt-6 w-full">
                <p className="text-base font-bold text-teal-600">↓ 17% below average</p>
              </div>
            </div>
          </div>

          {/* Expandable Section for Top Chemicals */}
          {selectedClassification && (
            <div className="mt-6 col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sortChemicalsByPercentile(filterChemicalsByExposure(chemicals, selectedClassification))
                    .slice(0, 3)
                    .map((chemical) => {
                      const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
                      return (
                        <Link
                          key={chemical.compound}
                          href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                          className="border border-gray-200 rounded-lg p-4 bg-white hover:border-teal-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                              {chemical.compound}
                            </h4>
                            <div className={`ml-2 px-2 py-1 rounded text-xs font-bold ${statusInfo.textColor}`} style={{ backgroundColor: `${statusInfo.color}20` }}>
                              {statusInfo.text}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{chemical.exposureCategory}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-500">
                              Value: {chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                            </div>
                            <div className={`text-sm font-bold ${statusInfo.textColor}`}>
                              {Math.round((chemical.percentile || 0) * 100)}%
                            </div>
                          </div>
                        </Link>
                      );
                    })}
              </div>
            </div>
          )}
        </div>

        {/* Duplicated Section - Detection Overview */}
        <div className="mb-12 px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
            {/* Left Side */}
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  <span className="text-3xl text-teal-600">{chemicals.filter(c => c.value > 0).length}</span> chemicals detected
                </h2>
              </div>
              <DetectionBreakdownChart 
                chemicals={chemicals} 
                onBarClick={(classification) => {
                  setSelectedClassification(selectedClassification === classification ? null : classification);
                }}
              />
            </div>

            {/* Right Side - Category List */}
            <div className="flex flex-col space-y-4">
              {allCategories.map((category) => {
                const categoryStatusInfo = getCategoryStatusInfo(category.chemicals);
                const maxDetected = Math.max(...allCategories.map(c => c.detectedCount), 1);
                const barWidth = (category.detectedCount / maxDetected) * 100;
                
                // Get the color based on classification
                const getBarColor = (): string => {
                  if (categoryStatusInfo.text === 'Pay Attention') {
                    return EXPOSURE_COLORS.payAttention;
                  } else if (categoryStatusInfo.text === 'Monitor Only') {
                    return EXPOSURE_COLORS.monitorOnly;
                  } else {
                    return EXPOSURE_COLORS.lowExposure;
                  }
                };
                const barColor = getBarColor();
                
                // Get category icon
                const getCategoryIcon = (categoryName: string) => {
                  const iconMap: Record<string, React.ReactElement> = {
                    'Agricultural Chemicals': (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
                      </svg>
                    ),
                    'Containers & Coatings': (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/>
                        <path d="M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/>
                        <path d="M3 7h18"/>
                        <path d="M7 7v10"/>
                        <path d="M17 7v10"/>
                      </svg>
                    ),
                    'Household Products': (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <path d="M9 22V12h6v10"/>
                      </svg>
                    ),
                    'Industrial Chemicals': (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                      </svg>
                    ),
                    'Persistent Pollutants': (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                        <path d="M8 12h8"/>
                        <path d="M12 8v8"/>
                      </svg>
                    ),
                  };
                  return iconMap[categoryName] || null;
                };
                
                return (
                  <div key={category.name} className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="text-teal-600 mt-0.5 flex-shrink-0">
                      {getCategoryIcon(category.name)}
                    </div>
                    
                    {/* Name and Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        <span className="text-sm font-semibold text-gray-900 ml-2">{category.detectedCount}</span>
                      </div>
                      {/* Indicator Bar */}
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${barWidth}%`,
                            backgroundColor: barColor
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expandable Section for Top Chemicals */}
          {selectedClassification && (
            <div className="mt-6 col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sortChemicalsByPercentile(filterChemicalsByExposure(chemicals, selectedClassification))
                    .slice(0, 3)
                    .map((chemical) => {
                      const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);
                      return (
                        <Link
                          key={chemical.compound}
                          href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                          className="border border-gray-200 rounded-lg p-4 bg-white hover:border-teal-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                              {chemical.compound}
                            </h4>
                            <div className={`ml-2 px-2 py-1 rounded text-xs font-bold ${statusInfo.textColor}`} style={{ backgroundColor: `${statusInfo.color}20` }}>
                              {statusInfo.text}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{chemical.exposureCategory}</div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-500">
                              Value: {chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                            </div>
                            <div className={`text-sm font-bold ${statusInfo.textColor}`}>
                              {Math.round((chemical.percentile || 0) * 100)}%
                            </div>
                          </div>
                        </Link>
                      );
                    })}
              </div>
            </div>
          )}
        </div>

        {/* Overall Exposure Summary */}
        <div className="mb-12">
          <OverallExposureSummary chemicals={chemicals} />
        </div>

        {/* Category Comparison Chart */}
        <div className="mb-12">
          <CategoryComparisonChart chemicals={chemicals} />
        </div>

        {/* Two Column Layout: Top Category Preview + Navigation Hub */}
        <div className="mb-10">
          <div className="space-y-1">
            {/* Header row */}
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-0">Top Category</h2>
            </div>

            {/* Subheader */}
            <div className="mb-4">
              <p className="text-gray-600 text-sm">
                {allCategories.length > 0 
                  ? `Your category with the most detected chemicals`
                  : 'No category data available'
                }
              </p>
            </div>

            {/* Content row: Top Category Card + Navigation Hub side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Top Category Content - Takes 2 columns */}
              <div className="lg:col-span-2 flex flex-col h-full min-h-0">
                {allCategories.length > 0 && (() => {
                  const topCategory = allCategories[0];
                  const detectedCount = topCategory.chemicals.filter(c => c.value > 0).length;
                  const totalCount = topCategory.chemicals.length;
                  const detectionRate = totalCount > 0 ? Math.round((detectedCount / totalCount) * 100) : 0;
                  const statusInfo = getCategoryStatusInfo(topCategory.chemicals);
                  const topChemicals = sortChemicalsByPercentile(topCategory.chemicals.filter(c => c.value > 0)).slice(0, 3);
                  const briefDescription = topCategory.overview?.summary_sections?.[0]?.content 
                    ? topCategory.overview.summary_sections[0].content.substring(0, 200) + (topCategory.overview.summary_sections[0].content.length > 200 ? '...' : '')
                    : 'Explore chemicals in this category and understand your exposure levels.';

                  // Get category icon
                  const getCategoryIcon = (categoryName: string) => {
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
                    return iconMap[categoryName] || null;
                  };

                  return (
                    <div className="rounded-lg pr-6 pt-6 pb-6 w-full flex flex-col flex-1 min-h-0 overflow-hidden relative">
                      {/* Top section: Category info and stats */}
                      <div className="grid grid-cols-2 gap-6 mb-4 flex-shrink-0 -mt-6">
                        {/* Left side: Category icon, name, and status */}
                        <div className="flex flex-col items-center justify-center pr-6 border-r border-gray-200">
                          <div className="text-teal-600 mb-3">
                            {getCategoryIcon(topCategory.name)}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 text-center">{topCategory.name}</h3>
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                            {statusInfo.text}
                          </div>
                        </div>

                        {/* Right side: Stats */}
                        <div className="flex flex-col justify-center pl-6 w-full">
                          <div className="w-full pb-2 pt-10 border-b border-gray-200 flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-500">Detection Rate</div>
                            <div className="text-sm text-gray-900 text-right">{detectionRate}%</div>
                          </div>
                          <div className="w-full py-2 border-b border-gray-200 flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-500">Total Chemicals</div>
                            <div className="text-sm text-gray-900 text-right">{totalCount}</div>
                          </div>
                          <div className="w-full py-2 flex items-center justify-between gap-4">
                            <div className="text-xs text-gray-500">Detected</div>
                            <div className="text-sm text-gray-900 text-right">{detectedCount} of {totalCount}</div>
                          </div>
                        </div>
                      </div>

                      {/* Middle section: Description */}
                      <div className="mb-4 flex-shrink-0">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {briefDescription}
                        </p>
                      </div>

                      {/* Bottom section: Top chemicals */}
                      {topChemicals.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-gray-200 flex-shrink-0">
                          <div className="text-xs text-gray-500 mb-2">Top Chemicals</div>
                          <div className="space-y-2">
                            {topChemicals.map((chemical) => {
                              const percentileColor = getPercentileColor(chemical.percentile, chemical.value);
                              return (
                                <Link
                                  key={chemical.compound}
                                  href={`/chemical/${encodeURIComponent(chemical.compound)}?from=dashboard`}
                                  className="flex items-center justify-between text-sm hover:text-teal-600 transition-colors"
                                >
                                  <span className="line-clamp-1">{chemical.compound}</span>
                                  <span className={`${percentileColor} font-semibold ml-2 flex-shrink-0`}>
                                    {formatPercentile(chemical.percentile, chemical.value)}
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              {/* Navigation Hub - Takes 1 column */}
              <div className="lg:col-span-1 -mt-17">
                <NavigationHub />
              </div>
            </div>
          </div>
        </div>

        {/* Top Priority Chemicals */}
        <div className="mb-12">
          <TopPriorityChemicals chemicals={chemicals} />
        </div>

        {/* Overall Exposure Sources */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Exposure Sources</h2>
            <p className="text-gray-600 text-sm">Primary sources of detected chemicals</p>
          </div>
          <ExposureSourceAnalysis chemicals={chemicals} noCard={true} />
        </div>
      </div>
    </div>
  );
}
