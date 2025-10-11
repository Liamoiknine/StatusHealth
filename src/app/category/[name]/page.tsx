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

// Category information mapping
const categoryInfo: Record<string, { description: string; sources: string[]; healthImpact: string }> = {
  'Agricultural Chemicals': {
    description: 'Chemicals used in farming and agriculture, including pesticides, herbicides, and fungicides. These compounds are designed to protect crops but can persist in the environment and food chain.',
    sources: ['Food products', 'Water contamination', 'Soil exposure', 'Occupational exposure'],
    healthImpact: 'May affect nervous system, endocrine function, and reproductive health. Long-term exposure linked to various health concerns.'
  },
  'Containers & Coatings': {
    description: 'Chemicals found in packaging materials, containers, and protective coatings. These substances can leach into food and beverages or be released into the environment.',
    sources: ['Food packaging', 'Beverage containers', 'Protective coatings', 'Industrial applications'],
    healthImpact: 'Potential endocrine disruption and developmental effects. Some compounds are persistent and bioaccumulative.'
  },
  'Household Products': {
    description: 'Chemicals commonly found in household items, cleaning products, and consumer goods used in daily life.',
    sources: ['Cleaning products', 'Personal care items', 'Home furnishings', 'Consumer electronics'],
    healthImpact: 'May cause respiratory irritation, skin sensitization, and contribute to indoor air pollution.'
  },
  'Industrial Chemicals': {
    description: 'Chemicals used in manufacturing, industrial processes, and commercial applications. These compounds may be released into the environment through industrial activities.',
    sources: ['Manufacturing processes', 'Industrial emissions', 'Occupational exposure', 'Environmental contamination'],
    healthImpact: 'Potential carcinogenic effects, organ toxicity, and environmental persistence. Occupational exposure poses highest risk.'
  },
  'Persistent Pollutants': {
    description: 'Long-lasting chemicals that persist in the environment and accumulate in living organisms. These compounds resist degradation and can travel long distances.',
    sources: ['Environmental contamination', 'Food chain bioaccumulation', 'Long-range transport', 'Historical contamination'],
    healthImpact: 'Bioaccumulative compounds that can affect immune system, reproductive health, and neurological development.'
  },
  'Personal Care Products': {
    description: 'Chemicals found in cosmetics, personal hygiene products, and beauty items. These compounds come into direct contact with skin and may be absorbed.',
    sources: ['Cosmetics', 'Shampoos and soaps', 'Fragrances', 'Skin care products'],
    healthImpact: 'Potential skin sensitization, endocrine disruption, and allergic reactions. Direct skin contact increases absorption risk.'
  }
};

export default function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        // Await params to get the category name
        const resolvedParams = await params;
        setCategoryName(decodeURIComponent(resolvedParams.name));
        
        // Load chemicals data
        const data = await parseChemicalsCSV();
        setChemicals(data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LifeLine color="#32cd32" size="medium" text="" textColor="" />
      </div>
    );
  }

  // Group chemicals by exposure category for sidebar
  const categoryGroups = chemicals.reduce((groups, chemical) => {
    const category = chemical.exposureCategory;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(chemical);
    return groups;
  }, {} as Record<string, ChemicalData[]>);

  // Create categories list for sidebar
  const categoriesWithChemicals = Object.entries(categoryGroups)
    .map(([category, chemicals]) => {
      const categoryDetectedCount = chemicals.filter(c => c.value > 0).length;
      const totalCount = chemicals.length;
      return {
        category,
        detectedCount: categoryDetectedCount,
        totalCount
      };
    })
    .sort((a, b) => b.detectedCount - a.detectedCount);

  // Filter chemicals for this category
  const categoryChemicals = chemicals.filter(chemical => 
    chemical.exposureCategory === categoryName
  );

  // Sort by value (highest first)
  const sortedChemicals = categoryChemicals.sort((a, b) => b.value - a.value);
  
  const detectedCount = categoryChemicals.filter(c => c.value > 0).length;
  const totalCount = categoryChemicals.length;

  // Get category information
  const info = categoryInfo[categoryName] || {
    description: 'Information about this exposure category is being updated.',
    sources: ['Various sources'],
    healthImpact: 'Health impact information is being compiled.'
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar */}
        <CategoriesSidebar categories={categoriesWithChemicals} currentCategory={categoryName} />

        {/* Main Content */}
        <div className="flex-1">
          <div className="container mx-auto px-8 py-8 max-w-5xl">
        <div className="mb-8">
          <Link href="/categories" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Categories
          </Link>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName}</h1>
              <p className="text-gray-600">Detected {detectedCount}/{totalCount} exposures</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-blue-700">
                {totalCount} total chemicals
              </span>
            </div>
          </div>
        </div>

        {/* Category Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About {categoryName}</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{info.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Sources</h3>
              <ul className="space-y-2">
                {info.sources.map((source, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Impact</h3>
              <p className="text-gray-700 leading-relaxed">{info.healthImpact}</p>
            </div>
          </div>
        </div>

        {/* Chemicals Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Chemicals in this Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedChemicals.map((chemical, index) => (
              <Link 
                key={index} 
                href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                className="block"
              >
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                    {chemical.compound}
                  </h3>
                  <div className={`text-lg font-bold ${getValueColor(chemical.value)} mb-2`}>
                    {chemical.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    Primary Source: {chemical.primarySource}
                  </div>
                  {chemical.secondarySources && (
                    <div className="text-xs text-gray-500">
                      Also found in: {chemical.secondarySources}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
        
            <div className="text-sm text-gray-500 text-center">
              Showing {sortedChemicals.length} chemicals in {categoryName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
