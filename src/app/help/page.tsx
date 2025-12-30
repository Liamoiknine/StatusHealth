'use client';

import { useState, useEffect } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { groupChemicalsByCategory, getCategoryStats } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import AllChemicalsOverview from '@/components/AllChemicalsOverview';
import { getAllChemicalsOverview } from '@/data/category-overviews';
import { ChemicalData } from '@/app/api/csv-parser';

export default function HelpPage() {
  const { selectedTest } = useTest();
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9CBB04] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const categoryGroups = groupChemicalsByCategory(chemicals);
  const categoriesWithStats = getCategoryStats(categoryGroups);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Documentation</h1>
          <p className="text-gray-600">Learn how to understand your chemical exposure data and interpret your results</p>
        </div>

        {/* Overview Section */}
        <AllChemicalsOverview 
          data={getAllChemicalsOverview()} 
          categoryStats={categoriesWithStats.map(({ category, detectedCount, totalCount }) => ({
            category,
            detectedCount,
            totalCount
          }))}
        />
      </div>
    </div>
  );
}

