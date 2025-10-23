'use client';

import { useState, useEffect } from 'react';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { ChemicalData } from '@/app/api/csv-parser';
import { getPercentileColor, formatPercentile } from '@/app/api/utils';
import { useTest } from '@/contexts/TestContext';
import Link from 'next/link';
import LongitudinalChart from '@/components/LongitudinalChart';

export default function ChemicalPage({ params }: { params: Promise<{ name: string }> }) {
  const { selectedTest } = useTest();
  const [chemicalName, setChemicalName] = useState<string>('');
  const [chemical, setChemical] = useState<ChemicalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const resolvedParams = await params;
        const decodedName = decodeURIComponent(resolvedParams.name);
        setChemicalName(decodedName);
        
        const chemicals = await parseChemicalsCSV(selectedTest);
        const foundChemical = chemicals.find(c => c.compound === decodedName);
        setChemical(foundChemical || null);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params, selectedTest]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  if (!chemical) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Chemical Not Found</h1>
          <p className="text-gray-600 mb-8">The chemical &quot;{chemicalName}&quot; was not found.</p>
          <Link 
            href="/categories" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Link 
            href={`/category/${encodeURIComponent(chemical.exposureCategory)}`} 
            className="inline-block text-blue-600 hover:text-blue-800 mb-8 transition-colors"
          >
            ← Back to {chemical.exposureCategory}
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chemical Information Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {chemical.compound}
              </h1>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-4 border-b border-gray-200">
                  <span className="text-lg font-medium text-gray-700">Chemical Name:</span>
                  <span className="text-lg text-gray-900">{chemical.compound}</span>
                </div>
                
                <div className="flex justify-between items-center py-4 border-b border-gray-200">
                  <span className="text-lg font-medium text-gray-700">Exposure Category:</span>
                  <Link 
                    href={`/category/${encodeURIComponent(chemical.exposureCategory)}`}
                    className="text-lg text-blue-600 hover:text-blue-800"
                  >
                    {chemical.exposureCategory}
                  </Link>
                </div>
                
                <div className="flex justify-between items-center py-4 border-b border-gray-200">
                  <span className="text-lg font-medium text-gray-700">Measured Value:</span>
                  <span className="text-lg text-gray-900">
                    {chemical.value > 0 ? `${chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL` : 'Not Detected'}
                  </span>
                </div>

                {(chemical.rangeLow !== undefined && chemical.rangeHigh !== undefined) && (
                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                    <span className="text-lg font-medium text-gray-700">Exposure Range:</span>
                    <span className="text-lg text-gray-900">
                      {chemical.rangeLow.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} - {chemical.rangeHigh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-4 border-b border-gray-200">
                  <span className="text-lg font-medium text-gray-700">Percentile:</span>
                  <span className={`text-2xl font-bold ${getPercentileColor(chemical.percentile, chemical.value)}`}>
                    {formatPercentile(chemical.percentile, chemical.value)}
                  </span>
                </div>

                {chemical.population !== undefined && (
                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                    <span className="text-lg font-medium text-gray-700">% Population Exposed:</span>
                    <span className="text-lg text-gray-900">
                      {(chemical.population * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {chemical.population !== undefined && (
                <div className="mt-4 text-xs text-gray-500 italic">
                  *Percentiles based on the exposed population
                </div>
              )}
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-1">Primary Source:</h3>
                    <p className="text-gray-600">{chemical.primarySource}</p>
                  </div>
                  {chemical.secondarySources && (
                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-1">Secondary Sources:</h3>
                      <p className="text-gray-600">{chemical.secondarySources}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Longitudinal Chart */}
            <div>
              <LongitudinalChart chemicalName={chemical.compound} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}