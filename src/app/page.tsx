'use client';

import { parseChemicalsCSV, ChemicalData } from '@/lib/csv-parser';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LifeLine } from 'react-loading-indicators';
import ExposureReportCard from '@/components/ExposureReportCard';
import ProfilePanel from '@/components/ProfilePanel';


function getValueColor(value: number) {
  if (value >= 1000) return 'text-red-600';
  if (value <= 100) return 'text-green-600';
  return 'text-yellow-400';
}


export default function HomePage() {
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]); // stores all the chemicals recieved from the csv
  const [loading, setLoading] = useState(true); // controls whether to show a loading message or not

  useEffect(() => {
    async function loadChemicals() {
      try {
        const data = await parseChemicalsCSV();
        setChemicals(data);
      } catch (error) {
        console.error('Error loading chemicals:', error);
      } finally {
        setLoading(false);
      }
    }
    loadChemicals();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LifeLine color="#32cd32" size="medium" text="" textColor="" />
      </div>
    );
  }

  // Group chemicals by exposure category and get top 3 from each
  const categoryGroups = chemicals.reduce((groups, chemical) => {
    const category = chemical.exposureCategory;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(chemical);
    return groups;
  }, {} as Record<string, ChemicalData[]>);


  // Sort each category by value (highest first) and take top 3
  const topChemicalsByCategory = Object.entries(categoryGroups).map(([category, chemicals]) => {
    const categoryDetectedCount = chemicals.filter(c => c.value > 0).length;
    const totalCount = chemicals.length;
    return {
      category,
      chemicals: chemicals.sort((a, b) => b.value - a.value).slice(0, 3),
      detectedCount: categoryDetectedCount,
      totalCount
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-8 pt-4 pb-8 max-w-5xl">
        
        {/* Profile Panel */}
        <ProfilePanel />
        
        {/* Cards Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Left Card - Blank */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-[400px]">
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-base">Additional content coming soon</p>
              </div>
            </div>
          </div>

          {/* Right Card - Exposure Report */}
          <ExposureReportCard categories={topChemicalsByCategory} />
        </div>

      </div>
    </div>
  );
}