'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactElement } from 'react';
import { CategoryOverview as CategoryOverviewType } from '@/data/category-overviews';
import { getAllCategoryNames } from '@/data/category-overviews';

interface AllChemicalsOverviewProps {
  data: CategoryOverviewType;
  onCategoryClick?: (category: string) => void;
  categoryStats?: Array<{
    category: string;
    detectedCount: number;
    totalCount: number;
  }>;
}

// Category icons mapping
const categoryIcons: Record<string, ReactElement> = {
  'Agricultural Chemicals': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  ),
  'Containers & Coatings': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/>
      <path d="M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/>
      <path d="M3 7h18"/>
      <path d="M7 7v10"/>
      <path d="M17 7v10"/>
    </svg>
  ),
  'Household Products': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  ),
  'Industrial Chemicals': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  'Persistent Pollutants': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="M4 12H2"/>
      <path d="M22 12h-2"/>
      <path d="m15.536 15.536 1.414 1.414"/>
      <path d="m7.05 7.05-1.414-1.414"/>
      <path d="m15.536 8.464 1.414-1.414"/>
      <path d="m7.05 16.95-1.414 1.414"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  'Personal Care Products': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M8 12h8"/>
      <path d="M12 8v8"/>
    </svg>
  ),
};

// Exposure pathway icons
const pathwayIcons: Record<string, ReactElement> = {
  'Ingestion': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 3V2"/>
      <path d="m15.4 17.4 3.2-2.8a2 2 0 1 1 2.8 2.9l-3.6 3.3c-.7.8-1.7 1.2-2.8 1.2h-4c-1.1 0-2.1-.4-2.8-1.2l-1.302-1.464A1 1 0 0 0 6.151 19H5"/>
      <path d="M2 14h12a2 2 0 0 1 0 4h-2"/>
      <path d="M4 10h16"/>
      <path d="M5 10a7 7 0 0 1 14 0"/>
      <path d="M5 14v6a1 1 0 0 1-1 1H2"/>
    </svg>
  ),
  'Inhalation': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
    </svg>
  ),
  'Dermal Contact': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 4.354a4 4 0 1 1 0 5.292M15 21H3v-1a6 6 0 0 1 12 0v1zm0 0h6v-1a6 6 0 0 0-9-5.197M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
    </svg>
  ),
  'Maternal Transfer': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z"/>
    </svg>
  ),
};

// Parse markdown-style formatting
const parseMarkdown = (text: string): string => {
  if (!text) return '';
  
  const escapeHtml = (str: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
  };
  
  let parsed = escapeHtml(text);
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>');
  return parsed;
};

export default function AllChemicalsOverview({ data, onCategoryClick, categoryStats = [] }: AllChemicalsOverviewProps) {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Database Overview']));
  const allCategories = getAllCategoryNames();
  const interpretingResultsRef = useRef<HTMLDivElement>(null);
  const regulatoryContextRef = useRef<HTMLDivElement>(null);
  
  const handleCategoryClick = (category: string) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    } else {
      // Default behavior: navigate to categories page
      router.push(`/categories?category=${encodeURIComponent(category)}`);
    }
  };
  
  const toggleSection = (header: string, ref?: React.RefObject<HTMLDivElement | null>) => {
    const wasExpanded = expandedSections.has(header);
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(header)) {
        next.delete(header);
      } else {
        next.add(header);
      }
      return next;
    });
    
    // Scroll to section if we're expanding it
    if (!wasExpanded && ref?.current) {
      // Wait for expansion animation to complete, then scroll
      setTimeout(() => {
        if (!ref.current) return;
        
        const element = ref.current;
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.pageYOffset;
        const elementHeight = rect.height;
        const windowHeight = window.innerHeight;
        
        // Calculate target position based on actual expanded dimensions
        const spaceNeeded = elementHeight + 40;
        let targetScrollPosition: number;
        
        if (spaceNeeded <= windowHeight) {
          // Section fits in viewport - center it vertically
          targetScrollPosition = elementTop - (windowHeight - elementHeight) / 2;
        } else {
          // Section is taller than viewport - position at top with small offset
          targetScrollPosition = elementTop - 20;
        }
        
        targetScrollPosition = Math.max(0, targetScrollPosition);
        
        // Scroll to calculated position
        window.scrollTo({
          top: targetScrollPosition,
          behavior: 'smooth'
        });
      }, 320); // Wait for 300ms animation + small buffer to ensure accurate measurement
    }
  };

  const getCategoryStats = (categoryName: string) => {
    return categoryStats.find(s => s.category === categoryName);
  };

  // Calculate total chemicals across all categories
  const totalChemicals = categoryStats.reduce((sum, stat) => sum + stat.totalCount, 0);

  // Find sections
  const databaseOverview = data.summary_sections.find(s => s.header === 'Database Overview');
  const categoryOrg = data.summary_sections.find(s => s.header === 'Category Organization');
  const exposurePathways = data.summary_sections.find(s => s.header === 'Understanding Exposure Pathways');
  const interpretingResults = data.summary_sections.find(s => s.header === 'Interpreting Your Results');
  const regulatoryContext = data.summary_sections.find(s => s.header === 'Regulatory and Scientific Context');

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#9CBB04]/10 to-blue-50 border border-[#9CBB04]/30 rounded-xl p-8 mb-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Understanding Your Chemical Exposure Database</h2>
            <p 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(databaseOverview?.content || '')
              }}
            />
          </div>
          <div className="ml-6 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-sm border border-[#9CBB04]/30 rounded-lg px-4 py-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-[#9CBB04]">{totalChemicals}</div>
              <div className="text-xs text-gray-700 mt-0.5 font-medium">Total Chemicals</div>
              <div className="h-px bg-[#9CBB04]/20 my-2"></div>
              <div className="text-2xl font-bold text-[#9CBB04]">{allCategories.length}</div>
              <div className="text-xs text-gray-700 mt-0.5 font-medium">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      {categoryOrg && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-[#404B69]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Explore by Category
          </h3>
          <div className="pl-6">
            <p className="text-gray-600 mb-6 text-sm">
              {categoryOrg.content}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCategories.map((category) => {
              const stats = getCategoryStats(category);
              const icon = categoryIcons[category] || categoryIcons['Household Products'];
              const bullet = categoryOrg.bullets?.find(b => b.includes(`**${category}:**`));
              const description = bullet?.replace(/\*\*.*?:\*\*\s*/, '') || '';

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:border-[#404B69] hover:shadow-lg hover:shadow-[#404B69]/10 transition-all duration-300 text-left group shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[#9CBB04]/10 p-3 rounded-lg text-[#9CBB04] group-hover:bg-[#9CBB04]/20 transition-colors flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-[#404B69] transition-colors">
                        {category}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {description}
                      </p>
                      {stats && (
                        <div className="text-xs text-gray-500">
                          {stats.detectedCount}/{stats.totalCount} detected
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#404B69] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* Classification System */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Understanding the Classification System
        </h3>
        <div className="pl-6">
          <p className="text-gray-600 mb-6 text-sm">
            Your report uses a two-level classification system to help you understand your chemical exposure data. First, individual chemicals are classified based on how your levels compare to the general population. Then, entire categories are classified based on the chemicals they contain.
          </p>
          
          {/* Step 1: Individual Chemical Classification */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-[#9CBB04] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
            Individual Chemical Classification
          </h4>
          <p className="text-gray-600 mb-4 text-sm">
            Each chemical in your report is classified by comparing your exposure level to population data. This percentile ranking shows where you fall compared to others:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Pay Attention */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-[#db2c1d]/10 p-3 rounded-lg text-[#db2c1d] flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="text-base font-semibold text-gray-900 mb-2">Pay Attention</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong className="text-gray-900">60th-100th percentile:</strong> Your exposure is higher than 60% of the population. This indicates elevated levels that may warrant action to reduce exposure.
                  </p>
                </div>
              </div>
            </div>

            {/* Monitor Only */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-[#f5c236]/10 p-3 rounded-lg text-[#f5c236] flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="text-base font-semibold text-gray-900 mb-2">Monitor Only</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong className="text-gray-900">30th-60th percentile:</strong> Your exposure falls in the middle range. These levels are moderate and should be monitored over time.
                  </p>
                </div>
              </div>
            </div>

            {/* Low Exposure */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-[#9CBB04]/10 p-3 rounded-lg text-[#9CBB04] flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="text-base font-semibold text-gray-900 mb-2">Low Exposure</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong className="text-gray-900">1st-30th percentile:</strong> Your exposure is lower than most of the population. These levels are generally considered low.
                  </p>
                </div>
              </div>
            </div>

            {/* Not Detected */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-gray-500 flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="text-base font-semibold text-gray-900 mb-2">Not Detected</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong className="text-gray-900">Not found in your sample:</strong> The chemical was not detected in your test, which is the best possible result.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Category Classification */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-[#9CBB04] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
            Category Classification
          </h4>
          <p className="text-gray-600 mb-4 text-sm">
            After individual chemicals are classified, entire categories (like "Household Products" or "Personal Care Products") receive an overall classification based on the chemicals they contain. This gives you a quick overview of each category's overall exposure level:
          </p>
          <div className="bg-gradient-to-br from-[#9CBB04]/10 to-blue-50 border border-[#9CBB04]/30 rounded-xl p-5 mb-4 shadow-sm">
            <p className="text-sm text-gray-900 font-medium mb-2">How It Works:</p>
            <ul className="text-sm text-gray-700 space-y-1.5 pl-4 list-disc list-inside">
              <li><strong>Pay Attention:</strong> If 3 or more chemicals in the category are classified as "Pay Attention"</li>
              <li><strong>Monitor Only:</strong> If 3 or more chemicals are "Monitor Only" OR if 1 or more chemicals are "Pay Attention"</li>
              <li><strong>Low Exposure:</strong> If fewer than 3 chemicals are "Monitor Only" and no chemicals are "Pay Attention"</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            This two-step approach helps you understand both individual chemical exposures and overall category patterns. A category might be "Monitor Only" even if most chemicals are low, if just one chemical requires attention—helping you prioritize where to focus your efforts.
          </p>
        </div>
        </div>
      </div>

      {/* Exposure Pathways - Visual Cards */}
      {exposurePathways && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            How Chemicals Enter Your Body
          </h3>
          <div className="pl-6">
            <p className="text-gray-600 mb-6 text-sm">
              {exposurePathways.content}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exposurePathways.bullets?.map((bullet, index) => {
              const match = bullet.match(/\*\*(.*?):\*\*/);
              const pathwayName = match ? match[1] : '';
              const description = bullet.replace(/\*\*.*?:\*\*\s*/, '');
              const icon = pathwayIcons[pathwayName] || pathwayIcons['Ingestion'];

              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:border-[#9CBB04] transition-all shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[#9CBB04]/10 p-3 rounded-lg text-[#9CBB04] flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        {pathwayName}
                      </h4>
                      <p 
                        className="text-sm text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: parseMarkdown(description)
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-4 mb-12">
        {/* Interpreting Results */}
        {interpretingResults && (
          <div ref={interpretingResultsRef} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection(interpretingResults.header, interpretingResultsRef)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {interpretingResults.header}
              </h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-in-out ${expandedSections.has(interpretingResults.header) ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.has(interpretingResults.header) 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 pt-4 pb-6">
                <p 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(interpretingResults.content)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Regulatory Context */}
        {regulatoryContext && (
          <div ref={regulatoryContextRef} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSection(regulatoryContext.header, regulatoryContextRef)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#9CBB04]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {regulatoryContext.header}
              </h3>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-in-out ${expandedSections.has(regulatoryContext.header) ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.has(regulatoryContext.header) 
                  ? 'max-h-96 opacity-100' 
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 pt-4 pb-6">
                <p 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(regulatoryContext.content)
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

