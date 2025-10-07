'use client';

import { parseChemicalsCSV, ChemicalData } from '@/lib/csv-parser';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { LifeLine } from 'react-loading-indicators';


function getValueColor(value: number) {
  if (value >= 1000) return 'text-red-600';
  if (value <= 100) return 'text-green-600';
  return 'text-gray-600';
}


export default function HomePage() {
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]); // stores all the chemicals recieved from the csv
  const [showDetected, setShowDetected] = useState(false); // controls whether to show detected chemicals
  const [showUndetected, setShowUndetected] = useState(false); // controls whether to show undetected chemicals
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

  // Calculate counts for buttons
  const detectedCount = chemicals.filter(c => c.value > 0).length;
  const undetectedCount = chemicals.filter(c => c.value === 0).length;

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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Chemical Status Dashboard</h1>
        
        {/* User Profile Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-6">
            {/* Profile Picture */}
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">JD</span>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, John Doe</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-gray-500 mb-1">Age</div>
                  <div className="font-semibold text-gray-900">34 years</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-gray-500 mb-1">Occupation</div>
                  <div className="font-semibold text-gray-900">Researcher</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-gray-500 mb-1">Most Recent Test</div>
                  <div className="font-semibold text-gray-900">Dec 15, 2024</div>
                </div>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Active
              </div>
            </div>
          </div>
        </div>
        
        {/* Chemical Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {topChemicalsByCategory.map(({ category, chemicals, detectedCount, totalCount }) => (
            <div key={category} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">{category}</h2>
              <p className="text-sm text-gray-600 mb-4">Detected {detectedCount}/{totalCount}</p>
              <div className="grid grid-cols-1 gap-3">
                {chemicals.map((chemical, index) => (
                  <Link 
                    key={index} 
                    href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                    className="block"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                        {chemical.compound}
                      </h3>
                      <div className={`text-lg font-bold ${getValueColor(chemical.value)}`}>
                        {chemical.value.toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* See Detected/Undetected Buttons */}
        <div className="text-center mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setShowDetected(!showDetected);
                setShowUndetected(false);
              }}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                showDetected 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showDetected ? 'Hide Detected Chemicals' : `See All Detected (${detectedCount})`}
            </button>
            <button
              onClick={() => {
                setShowUndetected(!showUndetected);
                setShowDetected(false);
              }}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                showUndetected 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              {showUndetected ? 'Hide Undetected Chemicals' : `See Undetected (${undetectedCount})`}
            </button>
          </div>
        </div>

        {/* Detected Chemicals Grid */}
        {showDetected && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Detected Chemicals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {chemicals.filter(chemical => chemical.value > 0).map((chemical, index) => (
                <Link 
                  key={index} 
                  href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                  className="block"
                >
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                      {chemical.compound}
                    </h3>
                    <div className={`text-lg font-bold ${getValueColor(chemical.value)}`}>
                      {chemical.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {chemical.exposureCategory}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Click to view details
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Undetected Chemicals Grid */}
        {showUndetected && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Undetected Chemicals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {chemicals.filter(chemical => chemical.value === 0).map((chemical, index) => (
                <Link 
                  key={index} 
                  href={`/chemical/${encodeURIComponent(chemical.compound)}`}
                  className="block"
                >
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                      {chemical.compound}
                    </h3>
                    <div className="text-lg font-bold text-gray-400">
                      Not Detected
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {chemical.exposureCategory}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Click to view details
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-sm text-gray-500 text-center">
          Showing {chemicals.length} chemical entries
        </div>
      </div>
    </div>
  );
}