'use client';

import { useState, useEffect } from 'react';
import { useTest } from '@/contexts/TestContext';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { ChemicalData } from '@/app/api/csv-parser';
import { groupChemicalsByCategory, getCategoryStatusInfo, sortChemicalsByPercentile } from '@/app/api/utils';
import { getAllCategoryNames } from '@/data/category-overviews';
import { Check, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useRouter } from 'next/navigation';

function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [month, day, year] = dateStr.split('/');
    const date = new Date(parseInt(year) + 2000, parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

function formatMonth(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [month, day, year] = dateStr.split('/');
    const date = new Date(parseInt(year) + 2000, parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'short' });
  } catch {
    return dateStr;
  }
}

interface CategoryStatusCounts {
  optimal: number;
  monitor: number;
  high: number;
}

interface TrendDataPoint {
  month: string;
  level: 'High' | 'Med' | 'Low';
  value: number; // 0-2 for High/Med/Low
}

export default function Dashboard3Page() {
  const { selectedTest, availableTests } = useTest();
  const router = useRouter();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [allTestsData, setAllTestsData] = useState<ChemicalData[][]>([]);
  const [activeTab, setActiveTab] = useState<'exposure' | 'category'>('exposure');
  const [timeframe, setTimeframe] = useState('9');
  const [categoryStatusCounts, setCategoryStatusCounts] = useState<CategoryStatusCounts>({ optimal: 0, monitor: 0, high: 0 });
  const [top3Chemicals, setTop3Chemicals] = useState<ChemicalData[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [categoryTrendData, setCategoryTrendData] = useState<TrendDataPoint[]>([]);
  
  const currentTest = availableTests.find(test => test.id === selectedTest);
  const reportDate = currentTest?.date ? formatMonthYear(currentTest.date) : '';

  // Load current test chemicals
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

  // Load all tests for trend calculation
  useEffect(() => {
    async function loadAllTests() {
      try {
        const allData: ChemicalData[][] = [];
        for (let testId = 1; testId <= 4; testId++) {
          try {
            const data = await parseChemicalsCSV(testId);
            allData.push(data);
          } catch (error) {
            console.error(`Error loading test ${testId}:`, error);
          }
        }
        setAllTestsData(allData);
      } catch (error) {
        console.error('Error loading all tests:', error);
      }
    }
    loadAllTests();
  }, []);

  // Calculate category status counts
  useEffect(() => {
    if (chemicals.length === 0) return;

    const categoryGroups = groupChemicalsByCategory(chemicals);
    const categoryNames = getAllCategoryNames();
    
    let optimal = 0;
    let monitor = 0;
    let high = 0;

    categoryNames.forEach(categoryName => {
      const categoryChemicals = categoryGroups[categoryName] || [];
      if (categoryChemicals.length === 0) {
        optimal++; // Empty categories are considered optimal
        return;
      }

      const statusInfo = getCategoryStatusInfo(categoryChemicals);
      if (statusInfo.text === 'Low Exposure') {
        optimal++;
      } else if (statusInfo.text === 'Monitor Only') {
        monitor++;
      } else if (statusInfo.text === 'Pay Attention') {
        high++;
      } else {
        optimal++; // Default to optimal
      }
    });

    setCategoryStatusCounts({ optimal, monitor, high });
  }, [chemicals]);

  // Get top 3 highest exposures
  useEffect(() => {
    if (chemicals.length === 0) return;

    const detectedChemicals = chemicals.filter(c => c.value > 0);
    const sorted = sortChemicalsByPercentile(detectedChemicals);
    setTop3Chemicals(sorted.slice(0, 3));
  }, [chemicals]);

  // Calculate exposure trend data
  useEffect(() => {
    if (allTestsData.length === 0 || availableTests.length === 0) return;

    const trendPoints: TrendDataPoint[] = [];
    
    allTestsData.forEach((testData, index) => {
      const testMeta = availableTests.find(t => t.id === index + 1);
      if (!testMeta) return;

      // Calculate overall exposure level for this test
      const detectedChemicals = testData.filter(c => c.value > 0);
      if (detectedChemicals.length === 0) {
        trendPoints.push({
          month: formatMonth(testMeta.date),
          level: 'Low',
          value: 0
        });
      return;
    }

      // Calculate average percentile
      const avgPercentile = detectedChemicals.reduce((sum, c) => sum + (c.percentile || 0), 0) / detectedChemicals.length;
      
      let level: 'High' | 'Med' | 'Low';
      let value: number;
      
      if (avgPercentile > 0.6) {
        level = 'High';
        value = 2;
      } else if (avgPercentile > 0.3) {
        level = 'Med';
        value = 1;
      } else {
        level = 'Low';
        value = 0;
      }

      trendPoints.push({
        month: formatMonth(testMeta.date),
        level,
        value
      });
    });

    // Filter by timeframe
    const monthsToShow = parseInt(timeframe);
    const filtered = trendPoints.slice(-monthsToShow);
    setTrendData(filtered);
  }, [allTestsData, availableTests, timeframe]);

  // Calculate category trend data (average across all categories)
  useEffect(() => {
    if (allTestsData.length === 0 || availableTests.length === 0) return;

    const categoryTrendPoints: TrendDataPoint[] = [];
    const categoryNames = getAllCategoryNames();
    
    allTestsData.forEach((testData, index) => {
      const testMeta = availableTests.find(t => t.id === index + 1);
      if (!testMeta) return;

      // Calculate average percentile across all categories
      const categoryGroups = groupChemicalsByCategory(testData);
      let totalAvgPercentile = 0;
      let categoryCount = 0;

      categoryNames.forEach(categoryName => {
        const categoryChemicals = categoryGroups[categoryName] || [];
        const detected = categoryChemicals.filter(c => c.value > 0);
        if (detected.length > 0) {
          const avgPercentile = detected.reduce((sum, c) => sum + (c.percentile || 0), 0) / detected.length;
          totalAvgPercentile += avgPercentile;
          categoryCount++;
        }
      });

      if (categoryCount === 0) {
        categoryTrendPoints.push({
          month: formatMonth(testMeta.date),
          level: 'Low',
          value: 0
        });
        return;
      }

      const overallAvgPercentile = totalAvgPercentile / categoryCount;
      
      let level: 'High' | 'Med' | 'Low';
      let value: number;
      
      if (overallAvgPercentile > 0.6) {
        level = 'High';
        value = 2;
      } else if (overallAvgPercentile > 0.3) {
        level = 'Med';
        value = 1;
      } else {
        level = 'Low';
        value = 0;
      }

      categoryTrendPoints.push({
        month: formatMonth(testMeta.date),
        level,
        value
      });
    });

    // Filter by timeframe
    const monthsToShow = parseInt(timeframe);
    const filtered = categoryTrendPoints.slice(-monthsToShow);
    setCategoryTrendData(filtered);
  }, [allTestsData, availableTests, timeframe]);

  // Get category summary data
  const getCategorySummary = () => {
    if (chemicals.length === 0) return [];

    const categoryGroups = groupChemicalsByCategory(chemicals);
    const categoryNames = getAllCategoryNames();

    return categoryNames.map(categoryName => {
      const categoryChemicals = categoryGroups[categoryName] || [];
      const detected = categoryChemicals.filter(c => c.value > 0);
      const elevated = detected.filter(c => (c.percentile || 0) > 0.6);
      const statusInfo = getCategoryStatusInfo(categoryChemicals);
      
      let statusText = 'Optimal';
      let statusColor = 'text-[#9CBB04]';
      
      if (statusInfo.text === 'Pay Attention') {
        statusText = 'High';
        statusColor = 'text-red-600';
      } else if (statusInfo.text === 'Monitor Only') {
        statusText = 'Monitor';
        statusColor = 'text-orange-600';
      }

      return {
        name: categoryName,
        status: statusText,
        statusColor,
        elevated: elevated.length,
        total: categoryChemicals.length
      };
    });
  };

  const categorySummary = getCategorySummary();

  // Get color for top 3 chemicals
  const getChemicalColor = (chemical: ChemicalData, index: number) => {
    const percentile = chemical.percentile || 0;
    if (percentile > 0.6) return { dot: 'bg-red-500', text: 'text-red-600', valueColor: 'text-red-600' };
    if (percentile > 0.3) return { dot: 'bg-orange-500', text: 'text-orange-600', valueColor: 'text-orange-600' };
    return { dot: 'bg-yellow-500', text: 'text-yellow-600', valueColor: 'text-yellow-600' };
  };

  const maxBarValue = Math.max(categoryStatusCounts.optimal, categoryStatusCounts.monitor, categoryStatusCounts.high, 1);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-10 sm:px-16 lg:px-20 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Your Chemical Exposure</h1>
            <div className="h-1 bg-[#9CBB04] w-64"></div>
          </div>
          <p className="text-gray-500 text-lg">{reportDate} Report</p>
        </div>

        {/* Top Row Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Category Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Category Status</h2>
            <div className="space-y-3">
              {/* Optimal */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">Optimal</span>
                  <span className="text-sm font-bold text-gray-900">{categoryStatusCounts.optimal}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-[#9CBB04] h-3 rounded-full transition-all"
                    style={{ width: `${(categoryStatusCounts.optimal / maxBarValue) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Monitor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">Monitor</span>
                  <span className="text-sm font-bold text-gray-900">{categoryStatusCounts.monitor}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${(categoryStatusCounts.monitor / maxBarValue) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* High */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">High</span>
                  <span className="text-sm font-bold text-gray-900">{categoryStatusCounts.high}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-red-600 h-3 rounded-full transition-all"
                    style={{ width: `${(categoryStatusCounts.high / maxBarValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Highest Exposures Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Top 3 Highest Exposures</h2>
            <div className="space-y-3">
              {top3Chemicals.length > 0 ? (
                top3Chemicals.map((chemical, index) => {
                  const colors = getChemicalColor(chemical, index);
                  return (
                    <div key={chemical.compound} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.dot} flex-shrink-0 mt-0.5`}></div>
                      <div className="flex items-baseline justify-between flex-1 min-w-0 gap-3">
                        <span className="text-sm font-medium text-gray-900 truncate">{chemical.compound}</span>
                        <span className={`text-sm ${colors.valueColor} font-semibold flex-shrink-0 whitespace-nowrap`}>
                          {chemical.value.toFixed(1)} ng/mL
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No detected chemicals</p>
              )}
            </div>
          </div>

          {/* See Full Report Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">See Full Report</h2>
            <div className="flex items-start gap-4 mb-5">
              <Check className="w-6 h-6 text-[#9CBB04] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">{chemicals.length} compounds analyzed.</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/exposures')}
              className="flex items-center gap-1.5 text-[#9CBB04] hover:text-[#8AA803] text-sm font-medium transition-colors group"
            >
              View detailed breakdown
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Exposure Trend Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          {/* Tabs and Timeframe Selector */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('exposure')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'exposure'
                    ? 'bg-[#9CBB04]/10 text-[#8AA803] border border-[#9CBB04]/30'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Exposure Trend
              </button>
                    <button
                onClick={() => setActiveTab('category')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'category'
                    ? 'bg-[#9CBB04]/10 text-[#8AA803] border border-[#9CBB04]/30'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Category Trend
                    </button>
                </div>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#9CBB04]"
            >
              <option value="3">Last 3 Mo</option>
              <option value="6">Last 6 Mo</option>
              <option value="9">Last 9 Mo</option>
              <option value="12">Last 12 Mo</option>
            </select>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeTab === 'exposure' ? trendData : categoryTrendData}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CBB04" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9CBB04" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 2]}
                  ticks={[0, 1, 2]}
                  tickFormatter={(value) => {
                    if (value === 2) return 'High';
                    if (value === 1) return 'Med';
                    return 'Low';
                  }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload as TrendDataPoint;
                      return (
                        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                          <p className="text-sm font-medium">{data.month}</p>
                          <p className="text-sm text-gray-600">{data.level}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#9CBB04"
                  strokeWidth={2}
                  fill="url(#colorTrend)"
                  dot={{ fill: '#9CBB04', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Summary Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Category Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorySummary.map((category) => (
              <div key={category.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{category.name}</h3>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${category.statusColor}`}>
                    {category.status}
                  </span>
                  <span className={`text-sm ${
                    category.elevated > 0 
                      ? (category.status === 'High' ? 'text-red-600' : 'text-orange-600')
                      : 'text-gray-600'
                  }`}>
                    {category.elevated}/{category.total} elevated
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
