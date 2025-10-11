'use client';

import { parseChemicalsCSV, ChemicalData } from '@/lib/csv-parser';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LifeLine } from 'react-loading-indicators';
import CategoriesSidebar from '@/components/CategoriesSidebar';

function getValueColor(value: number) {
  if (value >= 1000) return 'text-red-600';
  if (value <= 100) return 'text-green-600';
  return 'text-yellow-400';
}

export default function CategoriesPage() {
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Group chemicals by exposure category
  const categoryGroups = chemicals.reduce((groups, chemical) => {
    const category = chemical.exposureCategory;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(chemical);
    return groups;
  }, {} as Record<string, ChemicalData[]>);

  // Sort each category by detected count (highest first) and take top 3 chemicals
  const categoriesWithChemicals = Object.entries(categoryGroups)
    .map(([category, chemicals]) => {
      const categoryDetectedCount = chemicals.filter(c => c.value > 0).length;
      const totalCount = chemicals.length;
      return {
        category,
        chemicals: chemicals.sort((a, b) => b.value - a.value).slice(0, 3),
        detectedCount: categoryDetectedCount,
        totalCount
      };
    })
    .sort((a, b) => b.detectedCount - a.detectedCount); // Sort by detected count (highest first)

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <CategoriesSidebar categories={categoriesWithChemicals} />

        {/* Main Content */}
        <div className="flex-1">
          <div className="container mx-auto px-8 py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Health Categories</h1>
              <p className="text-gray-600 mt-2">Detailed view of all health categories and their chemical exposures</p>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {categoriesWithChemicals.map(({ category, chemicals, detectedCount, totalCount }, index) => {
            // Determine status based on detected count (same logic as Exposure Report)
            let statusColor = 'bg-green-600'; // Optimal (dark green)
            let statusText = 'Optimal';
            let statusBgColor = 'bg-green-50';
            let statusTextColor = 'text-green-700';
            
            if (detectedCount === 0) {
              statusColor = 'bg-green-400'; // Health Booster (light green)
              statusText = 'Health Booster';
              statusBgColor = 'bg-green-50';
              statusTextColor = 'text-green-700';
            } else if (index < 2) {
              statusColor = 'bg-yellow-400'; // Monitor Only (yellow-orange)
              statusText = 'Monitor Only';
              statusBgColor = 'bg-yellow-50';
              statusTextColor = 'text-yellow-700';
            }
            
            return (
            <Link key={category} href={`/category/${encodeURIComponent(category)}`} className="block">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{category}</h2>
                    <p className="text-sm text-gray-600 mb-3">Detected {detectedCount}/{totalCount} exposures</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${statusBgColor}`}>
                    <span className={`text-xs font-medium ${statusTextColor}`}>{statusText}</span>
                  </div>
                </div>
              <div className="grid grid-cols-1 gap-3">
                {chemicals.map((chemical, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-3"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {chemical.compound}
                    </h3>
                    <div className={`text-lg font-bold ${getValueColor(chemical.value)}`}>
                      {chemical.value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </Link>
            );
          })}
            </div>
            
            <div className="text-sm text-gray-500 text-center">
              Showing {chemicals.length} chemical entries across {categoriesWithChemicals.length} categories
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
