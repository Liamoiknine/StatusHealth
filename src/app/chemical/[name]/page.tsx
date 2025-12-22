'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { parseChemicalsCSV } from '@/lib/csv-parser-client';
import { ChemicalData } from '@/app/api/csv-parser';
import { getPercentileColor, formatPercentile, getChemicalStatusInfo } from '@/app/api/utils';
import { EXPOSURE_COLOR_CLASSES, EXPOSURE_COLORS } from '@/lib/colors';
import { useTest } from '@/contexts/TestContext';
import Link from 'next/link';
import LongitudinalChart from '@/components/LongitudinalChart';
import { findHouseholdChemicalStructured, HouseholdChemicalDataStructured } from '@/data/structured/household-products';
import { findPersonalCareProductsChemicalStructured } from '@/data/structured/personal-care-products';
import { findPersistantPollutantsChemicalStructured } from '@/data/structured/persistent-pollutants';
import { findContainersAndCoatingsChemicalStructured } from '@/data/structured/containers-and-coatings';
import { findIndustrialChemicalsChemicalStructured } from '@/data/structured/industrial-chemicals';
import { findAgriculturalChemicalsChemicalStructured } from '@/data/structured/agricultural-chemicals';
import ChemicalDetailSidebar from '@/components/ChemicalDetailSidebar';

export default function ChemicalPage({ params }: { params: Promise<{ name: string }> }) {
  const { selectedTest } = useTest();
  const searchParams = useSearchParams();
  const [chemicalName, setChemicalName] = useState<string>('');
  const [chemical, setChemical] = useState<ChemicalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [householdDataStructured, setHouseholdDataStructured] = useState<HouseholdChemicalDataStructured | null>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);
  const tooltipRefs = {
    percentile: useRef<HTMLButtonElement>(null),
    measuredValue: useRef<HTMLButtonElement>(null),
    populationExposed: useRef<HTMLButtonElement>(null),
    exposureRange: useRef<HTMLButtonElement>(null),
  };
  
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

  // Calculate tooltip position when opened
  useEffect(() => {
    const updatePosition = () => {
      if (openTooltip && tooltipRefs[openTooltip as keyof typeof tooltipRefs]?.current) {
        const button = tooltipRefs[openTooltip as keyof typeof tooltipRefs].current;
        if (button) {
          const rect = button.getBoundingClientRect();
          const tooltipWidth = 256; // w-64 = 256px
          const tooltipHeight = 120; // Approximate height
          const spacing = 8; // Space between button and tooltip
          
          // Calculate left position: align right edge of tooltip with right edge of button
          let left = rect.right - tooltipWidth;
          
          // Ensure tooltip doesn't go off the left edge of screen
          if (left < 8) {
            left = 8;
          }
          
          // Ensure tooltip doesn't go off the right edge of screen
          if (rect.right > window.innerWidth - 8) {
            left = window.innerWidth - tooltipWidth - 8;
          }
          
          // Calculate top position: position above the button
          let top = rect.top - spacing;
          let placement: 'above' | 'below' = 'above';
          
          // If tooltip would go above viewport, position it below the button instead
          if (top < tooltipHeight + 8) {
            top = rect.bottom + spacing;
            placement = 'below';
          }
          
          setTooltipPosition({
            top: top,
            left: left,
            placement: placement,
          });
        }
      } else {
        setTooltipPosition(null);
      }
    };

    updatePosition();
    
    // Update position on scroll and resize
    if (openTooltip) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [openTooltip]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-tooltip-trigger]') && !target.closest('[data-tooltip-content]')) {
        setOpenTooltip(null);
      }
    };

    if (openTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openTooltip]);

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
  
  // Get bar color based on classification
  const getBarColor = (): string => {
    if (statusInfo.text === 'Pay Attention') {
      return EXPOSURE_COLORS.payAttention;
    } else if (statusInfo.text === 'Monitor Only') {
      return EXPOSURE_COLORS.monitorOnly;
    } else {
      return EXPOSURE_COLORS.lowExposure;
    }
  };
  const barColor = getBarColor();

  // Tooltip explanations
  const tooltipExplanations = {
    percentile: "Population Percentile indicates where your measured value falls compared to the general population. For example, a 75th percentile means your level is higher than 75% of people. This helps you understand how your exposure compares to others.",
    measuredValue: "Measured Value is the actual concentration of this chemical detected in your test sample, reported in nanograms per milliliter (ng/mL). This is the raw measurement from your laboratory test results.",
    populationExposed: "Population Exposed refers to the percentage of the population that it is estimated is exposed to this chemical. This statistic helps you understand how common exposure to this chemical is in the general population.",
    exposureRange: "Exposure Range shows the typical range of values (from low to high) observed in the population. Your measured value is positioned within this range, helping you see where you fall relative to typical exposure levels."
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Hero Section - Two Column Layout */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
            <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CBB04] rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#404B69] rounded-full blur-3xl"></div>
              </div>
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Left Column: Name + Description */}
              <div className="flex flex-col">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  {chemical.compound}
                </h1>
                <div className="border-t border-gray-300 mb-4"></div>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  This chemical is commonly found in various environmental and consumer products. Understanding its exposure levels and potential health impacts is important for making informed decisions about your health and lifestyle.
                </p>
                <Link 
                  href={
                    fromParam === 'categories' 
                      ? `/categories?category=${encodeURIComponent(chemical.exposureCategory)}`
                      : fromParam === 'exposures'
                      ? `/exposures`
                      : `/categories?category=${encodeURIComponent(chemical.exposureCategory)}`
                  }
                  className="inline-flex items-center text-[#9CBB04] hover:text-[#8AA803] transition-colors group text-sm font-medium"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {chemical.exposureCategory}
                </Link>
              </div>

              {/* Right Column: Cards + Exposure Bar */}
              <div className="flex flex-col gap-4">
                {/* Top Row: Three Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Population Percentile Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#9CBB04] transition-all group shadow-sm relative overflow-visible">
                    <button
                      ref={tooltipRefs.percentile}
                      onClick={() => setOpenTooltip(openTooltip === 'percentile' ? null : 'percentile')}
                      className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      aria-label="Information about Population Percentile"
                      data-tooltip-trigger
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {openTooltip === 'percentile' && tooltipPosition && typeof window !== 'undefined' && createPortal(
                      <div 
                        className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                        data-tooltip-content
                        style={{ 
                          top: `${tooltipPosition.top}px`,
                          left: `${tooltipPosition.left}px`,
                          transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                        }}
                      >
                        <p>{tooltipExplanations.percentile}</p>
                        <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
                      </div>,
                      document.body
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-[#9CBB04]/10 rounded-lg group-hover:bg-[#9CBB04]/20 transition-colors">
                        <svg className="w-4 h-4 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {formatPercentile(chemical.percentile, chemical.value)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Population Percentile</p>
                  </div>

                  {/* Measured Value Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#9CBB04] transition-all group shadow-sm relative overflow-visible">
                    <button
                      ref={tooltipRefs.measuredValue}
                      onClick={() => setOpenTooltip(openTooltip === 'measuredValue' ? null : 'measuredValue')}
                      className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      aria-label="Information about Measured Value"
                      data-tooltip-trigger
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {openTooltip === 'measuredValue' && tooltipPosition && typeof window !== 'undefined' && createPortal(
                      <div 
                        className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                        data-tooltip-content
                        style={{ 
                          top: `${tooltipPosition.top}px`,
                          left: `${tooltipPosition.left}px`,
                          transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                        }}
                      >
                        <p>{tooltipExplanations.measuredValue}</p>
                        <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
                      </div>,
                      document.body
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-[#9CBB04]/10 rounded-lg group-hover:bg-[#9CBB04]/20 transition-colors">
                        <svg className="w-4 h-4 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  {chemical.population !== undefined ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#9CBB04] transition-all group shadow-sm relative overflow-visible">
                      <button
                        ref={tooltipRefs.populationExposed}
                        onClick={() => setOpenTooltip(openTooltip === 'populationExposed' ? null : 'populationExposed')}
                        className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        aria-label="Information about Population Exposed"
                        data-tooltip-trigger
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {openTooltip === 'populationExposed' && tooltipPosition && typeof window !== 'undefined' && createPortal(
                        <div 
                          className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                          data-tooltip-content
                          style={{ 
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                          }}
                        >
                          <p>{tooltipExplanations.populationExposed}</p>
                          <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
                        </div>,
                        document.body
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-[#9CBB04]/10 rounded-lg group-hover:bg-[#9CBB04]/20 transition-colors">
                          <svg className="w-4 h-4 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          {(chemical.population * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Population Exposed</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm opacity-50 relative overflow-visible">
                      <button
                        ref={tooltipRefs.populationExposed}
                        onClick={() => setOpenTooltip(openTooltip === 'populationExposed' ? null : 'populationExposed')}
                        className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        aria-label="Information about Population Exposed"
                        data-tooltip-trigger
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {openTooltip === 'populationExposed' && tooltipPosition && typeof window !== 'undefined' && createPortal(
                        <div 
                          className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                          data-tooltip-content
                          style={{ 
                            top: `${tooltipPosition.top}px`,
                            left: `${tooltipPosition.left}px`,
                            transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                          }}
                        >
                          <p>{tooltipExplanations.populationExposed}</p>
                          <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
                        </div>,
                        document.body
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-400">N/A</span>
                      </div>
                      <p className="text-xs text-gray-500">Population Exposed</p>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Exposure Range Bar */}
                {(chemical.rangeLow !== undefined && chemical.rangeHigh !== undefined) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 pb-8 shadow-sm relative overflow-visible">
                    <button
                      ref={tooltipRefs.exposureRange}
                      onClick={() => setOpenTooltip(openTooltip === 'exposureRange' ? null : 'exposureRange')}
                      className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      aria-label="Information about Exposure Range"
                      data-tooltip-trigger
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {openTooltip === 'exposureRange' && tooltipPosition && typeof window !== 'undefined' && createPortal(
                      <div 
                        className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                        data-tooltip-content
                        style={{ 
                          top: `${tooltipPosition.top}px`,
                          left: `${tooltipPosition.left}px`,
                          transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                        }}
                      >
                        <p>{tooltipExplanations.exposureRange}</p>
                        <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
                      </div>,
                      document.body
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Exposure Range</span>
                      <span className="text-xs text-gray-600">
                        {chemical.rangeLow.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} - {chemical.rangeHigh.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ng/mL
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: chemical.rangeHigh - chemical.rangeLow > 0 
                            ? `${Math.min(100, Math.max(0, ((chemical.value - chemical.rangeLow) / (chemical.rangeHigh - chemical.rangeLow)) * 100))}%`
                            : '0%',
                          minWidth: chemical.value > 0 && chemical.rangeHigh - chemical.rangeLow > 0 ? '2%' : '0%',
                          backgroundColor: barColor
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Exposure Over Time Graph */}
        <div className="mb-8">
          <LongitudinalChart chemicalName={chemical.compound} />
        </div>

        {/* Detailed Information with Sidebar */}
        {householdDataStructured && (
          <ChemicalDetailSidebar data={householdDataStructured} />
        )}

      </div>
    </div>
  );
}