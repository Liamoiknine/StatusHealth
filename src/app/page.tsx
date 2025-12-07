'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { useTest } from '@/contexts/TestContext';
import { ChemicalData } from '@/app/api/csv-parser';
import OverallExposureSummary from '@/components/dashboard/OverallExposureSummary';
import CategoryComparisonChart from '@/components/dashboard/CategoryComparisonChart';
import TopPriorityChemicals from '@/components/dashboard/TopPriorityChemicals';
import NavigationHub from '@/components/dashboard/NavigationHub';
import ExposureSourceAnalysis from '@/components/category-overview/ExposureSourceAnalysis';
import CategoryCard from '@/components/CategoryCard';
import { groupChemicalsByCategory, getCategoryStats, filterChemicalsByExposure, sortChemicalsByPercentile, getChemicalStatusInfo } from '@/app/api/utils';
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
          <p className="text-sm text-gray-600">Viewing results for</p>
          <h2 className="text-xl font-bold text-gray-900 underline decoration-teal-600 cursor-pointer">
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
          <h1 className="text-5xl lg:text-6xl font-bold mb-3 tracking-tight leading-none">
            <span className="text-4xl lg:text-5xl text-gray-300 font-bold block">In a world of exposures</span>
            <span className="text-7xl lg:text-7xl text-teal-600 ml-8 lg:ml-20 block -mt-1 lg:-mt-1.5">we've got you covered.</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            View your comprehensive overview of your test results across all {chemicals.length} chemicals and 6 exposure categories
          </p>
        </div>

        {/* Test Selection Section */}
        <div className="mb-12 bg-white border-b-4 border-teal-600 rounded-lg p-6">
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
                className="bg-[#1a2540] text-white rounded-lg px-4 py-1.5 hover:bg-[#1a2540]/90 transition-colors font-medium text-sm inline-block"
              >
                View all tests
              </Link>
              <button className="bg-white text-teal-600 border border-teal-600 rounded-lg px-4 py-1.5 hover:bg-teal-50 transition-colors font-medium text-sm">
                Schedule your next test
              </button>
            </div>
          </div>
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

        {/* Overall Exposure Summary */}
        <div className="mb-12">
          <OverallExposureSummary chemicals={chemicals} />
        </div>

        {/* Category Comparison Chart */}
        <div className="mb-12">
          <CategoryComparisonChart chemicals={chemicals} />
        </div>

        {/* Two Column Layout: Top Category Preview + Navigation Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-30">
          {/* Top Category Preview - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Top Category</h2>
                <p className="text-gray-600 text-sm">Your category with the most detected chemicals</p>
              </div>
              <Link
                href="/categories"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
              >
                View all categories
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {allCategories.length > 0 && (
              <CategoryCard
                categoryName={allCategories[0].name}
                chemicals={allCategories[0].chemicals}
                allCategories={chemicals}
                overview={allCategories[0].overview}
                index={0}
              />
            )}
          </div>

          {/* Navigation Hub - Takes 1 column */}
          <div className="lg:col-span-1">
            <NavigationHub />
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
