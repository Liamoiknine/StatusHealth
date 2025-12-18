'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { ChemicalData } from '@/app/api/csv-parser';
import { getPercentileColor, formatPercentile, getChemicalStatusInfo } from '@/app/api/utils';
import { EXPOSURE_COLOR_CLASSES } from '@/lib/colors';
import { useTest } from '@/contexts/TestContext';
import Link from 'next/link';
import LongitudinalChart from '@/components/LongitudinalChart';
import { findHouseholdChemicalStructured, HouseholdChemicalDataStructured } from '@/data/structured/household-products';
import { findPersonalCareProductsChemicalStructured } from '@/data/structured/personal-care-products';
import { findPersistantPollutantsChemicalStructured } from '@/data/structured/persistent-pollutants';
import { findContainersAndCoatingsChemicalStructured } from '@/data/structured/containers-and-coatings';
import { findIndustrialChemicalsChemicalStructured } from '@/data/structured/industrial-chemicals';
import { findAgriculturalChemicalsChemicalStructured } from '@/data/structured/agricultural-chemicals';
import ChemicalDescriptionSections from '@/components/ChemicalDescriptionSections';

export default function ChemicalPage({ params }: { params: Promise<{ name: string }> }) {
  const { selectedTest } = useTest();
  const searchParams = useSearchParams();
  const [chemicalName, setChemicalName] = useState<string>('');
  const [chemical, setChemical] = useState<ChemicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [householdDataStructured, setHouseholdDataStructured] = useState<HouseholdChemicalDataStructured | null>(null);
  
  // Get the 'from' parameter to preserve tab context
  const fromParam = searchParams?.get('from') || 'dashboard';

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

        // Load structured data based on the chemical's category - only use category-specific data source
        let structuredChemical: HouseholdChemicalDataStructured | null = null;
        
        if (foundChemical?.exposureCategory) {
          const category = foundChemical.exposureCategory;
          
          // Map category to its specific data source
          if (category === 'Household Products') {
            structuredChemical = findHouseholdChemicalStructured(decodedName);
          } else if (category === 'Personal Care Products') {
            structuredChemical = findPersonalCareProductsChemicalStructured(decodedName);
          } else if (category === 'Persistent Pollutants') {
            structuredChemical = findPersistantPollutantsChemicalStructured(decodedName);
          } else if (category === 'Containers & Coatings') {
            structuredChemical = findContainersAndCoatingsChemicalStructured(decodedName);
          } else if (category === 'Industrial Chemicals') {
            structuredChemical = findIndustrialChemicalsChemicalStructured(decodedName);
          } else if (category === 'Agricultural Chemicals') {
            structuredChemical = findAgriculturalChemicalsChemicalStructured(decodedName);
          }
        }
        
        if (structuredChemical) {
          setHouseholdDataStructured(structuredChemical);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [params, selectedTest]);

  // Scroll to top when chemical name changes or page loads
  useEffect(() => {
    // Scroll to top when navigating to this page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chemicalName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9CBB04] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  if (!chemical) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Chemical Not Found</h1>
          <p className="text-gray-600 mb-8">The chemical &quot;{chemicalName}&quot; was not found.</p>
          <Link 
            href={
              fromParam === 'categories' 
                ? '/categories'
                : fromParam === 'exposures'
                ? '/exposures'
                : '/'
            }
            className="inline-block bg-[#9CBB04] text-white px-6 py-2 rounded-lg hover:bg-[#8AA803] transition-colors"
          >
            {fromParam === 'categories' ? 'Back to Categories' : fromParam === 'exposures' ? 'Back to Exposures' : 'Back to Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getChemicalStatusInfo(chemical.percentile, chemical.value);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CBB04] rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#404B69] rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {chemical.compound}
                  </h1>
                  <Link 
                    href={
                      fromParam === 'categories' 
                        ? `/categories?category=${encodeURIComponent(chemical.exposureCategory)}`
                        : fromParam === 'exposures'
                        ? `/exposures`
                        : `/categories?category=${encodeURIComponent(chemical.exposureCategory)}`
                    }
                    className="inline-flex items-center text-[#9CBB04] hover:text-[#8AA803] transition-colors group text-sm"
                  >
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {chemical.exposureCategory}
                  </Link>
                </div>
                
                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-full border ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                  <span className="text-xs font-semibold">{statusInfo.text}</span>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {/* Percentile Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#9CBB04] transition-all group shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#9CBB04]/10 rounded-lg group-hover:bg-[#9CBB04]/20 transition-colors">
                      <svg className="w-4 h-4 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className={`text-xl font-bold ${getPercentileColor(chemical.percentile, chemical.value)}`}>
                      {formatPercentile(chemical.percentile, chemical.value)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Population Percentile</p>
                  {chemical.population !== undefined && (
                    <p className="text-xs text-gray-500 mt-0.5">Based on exposed population</p>
                  )}
                </div>

                {/* Measured Value Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#404B69] transition-all group shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#404B69]/10 rounded-lg group-hover:bg-[#404B69]/20 transition-colors">
                      <svg className="w-4 h-4 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-gray-900">
                      {chemical.value > 0 ? `${chemical.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : 'N/D'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Measured Value</p>
                  {chemical.value > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">ng/mL</p>
                  )}
                </div>

                {/* Population Exposed Card */}
                {chemical.population !== undefined && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#9CBB04] transition-all group shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-[#9CBB04]/10 rounded-lg group-hover:bg-[#9CBB04]/20 transition-colors">
                        <svg className="w-4 h-4 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-[#9CBB04]">
                        {(chemical.population * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Population Exposed</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exposure Range */}
        {(chemical.rangeLow !== undefined && chemical.rangeHigh !== undefined) && (
          <div className="mb-8">
            <div className="relative max-w-[99%] mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600">Exposure Range</span>
                <span className="text-xs text-gray-600">
                  {chemical.rangeLow.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} - {chemical.rangeHigh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#9CBB04] to-[#404B69] rounded-full transition-all duration-300"
                  style={{ 
                    width: chemical.rangeHigh - chemical.rangeLow > 0 
                      ? `${Math.min(100, Math.max(0, ((chemical.value - chemical.rangeLow) / (chemical.rangeHigh - chemical.rangeLow)) * 100))}%`
                      : '0%',
                    minWidth: chemical.value > 0 && chemical.rangeHigh - chemical.rangeLow > 0 ? '2%' : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Information */}
        {householdDataStructured && (
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detailed Information
              </h2>
              
              {householdDataStructured.cas_rn && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">CAS Registry Number</span>
                      <span className="text-sm font-semibold text-gray-900">{householdDataStructured.cas_rn}</span>
                    </div>
                  </div>
                </div>
              )}

              <ChemicalDescriptionSections data={householdDataStructured} />
            </div>
          </div>
        )}

        {/* Longitudinal Chart - Full Width */}
        <div className="mb-8">
          <LongitudinalChart chemicalName={chemical.compound} />
        </div>

      </div>
    </div>
  );
}