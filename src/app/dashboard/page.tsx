'use client';

import { useState, useEffect } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { groupChemicalsByCategory, getCategoryStats } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import ExposureReportCard from '@/components/ExposureReportCard';
import ProfilePanel from '@/components/ProfilePanel';
import LongitudinalPreview from '@/components/LongitudinalPreview';
import { ChemicalData } from '@/app/api/csv-parser';

export default function DashboardPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  const categoryGroups = groupChemicalsByCategory(chemicals);
  const categoriesWithStats = getCategoryStats(categoryGroups);
  
  const topChemicalsByCategory = categoriesWithStats.map(({ category, chemicals, detectedCount, totalCount }) => ({
    category,
    chemicals,
    detectedCount,
    totalCount
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-8 pt-4 pb-8 max-w-5xl">
        <ProfilePanel />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 items-stretch">
          <LongitudinalPreview selectedTest={selectedTest} />
          <ExposureReportCard categories={topChemicalsByCategory} />
        </div>
      </div>
    </div>
  );
}

