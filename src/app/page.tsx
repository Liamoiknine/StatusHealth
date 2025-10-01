'use client';

import { parseChemicalsCSV, ChemicalData } from '@/lib/csv-parser';
import Link from 'next/link';
import { useState, useEffect } from 'react';

function getValueColor(value: number) {
  if (value >= 0.7) return 'text-red-600';
  if (value <= 0.3) return 'text-green-600';
  return 'text-gray-600';
}

function ChemicalCard({ chemical }: { chemical: ChemicalData }) {
  return (
    <Link 
      href={`/chemical/${encodeURIComponent(chemical.name)}`}
      className="block"
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
          {chemical.name}
        </h3>
        <div className="text-lg font-bold text-gray-700">
          {chemical.content}
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [chemicals, setChemicals] = useState<ChemicalData[]>([]);
  const [showAll, setShowAll] = useState(false);
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
        <div className="text-lg text-gray-600">Loading chemicals...</div>
      </div>
    );
  }

  const highestExposure = chemicals.slice(0, 4);
  const underControl = chemicals.slice(-4);
  const remainingChemicals = chemicals.slice(4, -4);

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
        
        {/* Top two windows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Highest Exposure Chemicals */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Highest Exposure Chemicals</h2>
            <div className="grid grid-cols-1 gap-3">
              {highestExposure.map((chemical, index) => (
                <Link 
                  key={index} 
                  href={`/chemical/${encodeURIComponent(chemical.name)}`}
                  className="block"
                >
                  <div className="bg-white border border-red-200 rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {chemical.name}
                    </h3>
                    <div className="text-lg font-bold text-red-600">
                      {chemical.content}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Under Control Chemicals */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-800 mb-4">Under Control Chemicals</h2>
            <div className="grid grid-cols-1 gap-3">
              {underControl.map((chemical, index) => (
                <Link 
                  key={index} 
                  href={`/chemical/${encodeURIComponent(chemical.name)}`}
                  className="block"
                >
                  <div className="bg-white border border-green-200 rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                      {chemical.name}
                    </h3>
                    <div className="text-lg font-bold text-green-600">
                      {chemical.content}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* See All Chemicals Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {showAll ? 'Hide All Chemicals' : 'See All Chemicals'}
          </button>
        </div>

        {/* All Chemicals Grid */}
        {showAll && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Chemicals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {chemicals.map((chemical, index) => (
                <Link 
                  key={index} 
                  href={`/chemical/${encodeURIComponent(chemical.name)}`}
                  className="block"
                >
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 truncate">
                      {chemical.name}
                    </h3>
                    <div className={`text-lg font-bold ${getValueColor(chemical.content)}`}>
                      {chemical.content}
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