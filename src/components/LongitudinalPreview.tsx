'use client';

import { useState, useEffect } from 'react';
import { ChemicalData } from '@/app/api/csv-parser';

interface CategoryTrendData {
  category: string;
  currentTest: {
    date: string;
    detectedCount: number;
    totalCount: number;
    avgValue: number;
  };
  previousTest: {
    date: string;
    detectedCount: number;
    totalCount: number;
    avgValue: number;
  } | null;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
}

interface LongitudinalPreviewProps {
  selectedTest: number;
}

export default function LongitudinalPreview({ selectedTest }: LongitudinalPreviewProps) {
  const [trendData, setTrendData] = useState<CategoryTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrendData() {
      try {
        setLoading(true);
        
        // Load current test data
        const currentResponse = await fetch(`/api/chemicals?testId=${selectedTest}`);
        if (!currentResponse.ok) {
          throw new Error('Failed to load current test data');
        }
        const currentData = await currentResponse.json();

        // Load previous test data (if available)
        let previousData: ChemicalData[] = [];
        if (selectedTest > 1) {
          try {
            const previousResponse = await fetch(`/api/chemicals?testId=${selectedTest - 1}`);
            if (previousResponse.ok) {
              previousData = await previousResponse.json();
            }
          } catch (error) {
            console.error(`Error loading previous test data:`, error);
          }
        }

        // Process data by category
        const categoryTrends: CategoryTrendData[] = [];
        const currentCategoryMap = new Map<string, ChemicalData[]>();
        const previousCategoryMap = new Map<string, ChemicalData[]>();

        // Group current test chemicals by category
        currentData.forEach((chemical: ChemicalData) => {
          const key = chemical.exposureCategory;
          if (!currentCategoryMap.has(key)) {
            currentCategoryMap.set(key, []);
          }
          currentCategoryMap.get(key)!.push(chemical);
        });

        // Group previous test chemicals by category
        previousData.forEach((chemical: ChemicalData) => {
          const key = chemical.exposureCategory;
          if (!previousCategoryMap.has(key)) {
            previousCategoryMap.set(key, []);
          }
          previousCategoryMap.get(key)!.push(chemical);
        });

        // Calculate trends for each category
        currentCategoryMap.forEach((currentChemicals, category) => {
          const previousChemicals = previousCategoryMap.get(category) || [];
          
          // Current test stats
          const currentDetected = currentChemicals.filter(c => c.value > 0);
          const currentAvgValue = currentDetected.length > 0 
            ? currentDetected.reduce((sum, c) => sum + c.value, 0) / currentDetected.length 
            : 0;

          const currentTestData = {
            date: currentChemicals[0]?.date || '',
            detectedCount: currentDetected.length,
            totalCount: currentChemicals.length,
            avgValue: currentAvgValue
          };

          // Previous test stats
          let previousTestData = null;
          if (previousChemicals.length > 0) {
            const previousDetected = previousChemicals.filter(c => c.value > 0);
            const previousAvgValue = previousDetected.length > 0 
              ? previousDetected.reduce((sum, c) => sum + c.value, 0) / previousDetected.length 
              : 0;

            previousTestData = {
              date: previousChemicals[0]?.date || '',
              detectedCount: previousDetected.length,
              totalCount: previousChemicals.length,
              avgValue: previousAvgValue
            };
          }

          // Calculate trend
          let changePercent = 0;
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

          if (previousTestData) {
            if (previousTestData.detectedCount > 0) {
              changePercent = ((currentTestData.detectedCount - previousTestData.detectedCount) / previousTestData.detectedCount) * 100;
            } else if (currentTestData.detectedCount > 0) {
              changePercent = 100; // New detections
            }

            if (Math.abs(changePercent) > 10) {
              trend = changePercent > 0 ? 'increasing' : 'decreasing';
            }
          }

          categoryTrends.push({
            category,
            currentTest: currentTestData,
            previousTest: previousTestData,
            trend,
            changePercent
          });
        });

        // Sort by change magnitude (most significant changes first)
        categoryTrends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

        setTrendData(categoryTrends.slice(0, 6)); // Show top 6 categories
      } catch (error) {
        console.error('Error loading trend data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTrendData();
  }, [selectedTest]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-[400px]">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading trend data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Changes Since Last Test
        {selectedTest > 1 && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            (Test {selectedTest - 1} → Test {selectedTest})
          </span>
        )}
      </h2>
      
      <div className="flex-1 space-y-4">
        {trendData.map((category) => (
          <CategoryTrendItem key={category.category} data={category} />
        ))}
      </div>

      {trendData.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>{selectedTest === 1 ? 'This is your first test - no previous data to compare' : 'No trend data available'}</p>
        </div>
      )}
    </div>
  );
}

function CategoryTrendItem({ data }: { data: CategoryTrendData }) {
  const { category, currentTest, previousTest, trend, changePercent } = data;
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        );
      case 'decreasing':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7L7 17M7 17H17M7 17V7" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatChangePercent = (percent: number) => {
    const abs = Math.abs(percent);
    if (abs < 1) return '<1%';
    return `${abs.toFixed(0)}%`;
  };

  const getChangeDescription = () => {
    if (!previousTest) {
      return 'New category';
    }
    
    if (changePercent === 0) {
      return 'No change';
    }
    
    if (changePercent > 0) {
      return `+${currentTest.detectedCount - previousTest.detectedCount} more detected`;
    } else {
      return `${Math.abs(currentTest.detectedCount - previousTest.detectedCount)} fewer detected`;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        {getTrendIcon()}
        <div>
          <h3 className="font-medium text-gray-900">{category}</h3>
          <p className="text-sm text-gray-600">
            {currentTest.detectedCount} of {currentTest.totalCount} detected
            {previousTest && (
              <span className="ml-2 text-xs">
                (was {previousTest.detectedCount} of {previousTest.totalCount})
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`text-sm font-medium ${getTrendColor()}`}>
          {previousTest ? (
            <>
              {trend === 'increasing' ? '+' : trend === 'decreasing' ? '-' : ''}{formatChangePercent(changePercent)}
            </>
          ) : (
            'New'
          )}
        </div>
        <div className="text-xs text-gray-500">{getChangeDescription()}</div>
      </div>
    </div>
  );
}
