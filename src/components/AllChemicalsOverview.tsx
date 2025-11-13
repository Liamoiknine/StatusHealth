'use client';

import { useState, useRef } from 'react';
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
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Containers & Coatings': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  'Household Products': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Industrial Chemicals': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'Persistent Pollutants': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  'Personal Care Products': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// Exposure pathway icons
const pathwayIcons: Record<string, ReactElement> = {
  'Ingestion': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  'Inhalation': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'Dermal Contact': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  'Maternal Transfer': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  return parsed;
};

export default function AllChemicalsOverview({ data, onCategoryClick, categoryStats = [] }: AllChemicalsOverviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Database Overview']));
  const allCategories = getAllCategoryNames();
  const interpretingResultsRef = useRef<HTMLDivElement>(null);
  const regulatoryContextRef = useRef<HTMLDivElement>(null);
  
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
      setTimeout(() => {
        ref.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 50); // Small delay to allow animation to start
    }
  };

  const getCategoryStats = (categoryName: string) => {
    return categoryStats.find(s => s.category === categoryName);
  };

  // Find sections
  const databaseOverview = data.summary_sections.find(s => s.header === 'Database Overview');
  const categoryOrg = data.summary_sections.find(s => s.header === 'Category Organization');
  const exposurePathways = data.summary_sections.find(s => s.header === 'Understanding Exposure Pathways');
  const interpretingResults = data.summary_sections.find(s => s.header === 'Interpreting Your Results');
  const regulatoryContext = data.summary_sections.find(s => s.header === 'Regulatory and Scientific Context');

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600/20 to-blue-600/20 border border-teal-500/30 rounded-xl p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-3">Understanding Your Chemical Exposure Database</h2>
            <p 
              className="text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(databaseOverview?.content || '')
              }}
            />
          </div>
          <div className="ml-6 flex gap-4">
            <div className="bg-[#1a2540]/50 border border-teal-500/30 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-teal-400">{allCategories.length}</div>
              <div className="text-xs text-gray-400 mt-1">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Cards Grid */}
      {categoryOrg && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Explore by Category
          </h3>
          <p className="text-gray-400 mb-6 text-sm">
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
                  onClick={() => onCategoryClick?.(category)}
                  className="bg-[#1a2540] border border-gray-700 rounded-lg p-5 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-900/20 transition-all duration-300 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-teal-500/10 p-3 rounded-lg text-teal-400 group-hover:bg-teal-500/20 transition-colors flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
                        {category}
                      </h4>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {description}
                      </p>
                      {stats && (
                        <div className="text-xs text-gray-500">
                          {stats.detectedCount}/{stats.totalCount} detected
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-teal-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Exposure Pathways - Visual Cards */}
      {exposurePathways && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            How Chemicals Enter Your Body
          </h3>
          <p className="text-gray-400 mb-6 text-sm">
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
                  className="bg-[#1a2540] border border-gray-700 rounded-lg p-5 hover:border-teal-500/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400 flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-white mb-2">
                        {pathwayName}
                      </h4>
                      <p 
                        className="text-sm text-gray-400 leading-relaxed"
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
      )}

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Interpreting Results */}
        {interpretingResults && (
          <div ref={interpretingResultsRef} className="bg-[#1a2540] border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(interpretingResults.header, interpretingResultsRef)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#0f1729] transition-colors cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {interpretingResults.header}
              </h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ease-in-out ${expandedSections.has(interpretingResults.header) ? 'rotate-180' : ''}`}
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
                  className="text-gray-300 leading-relaxed"
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
          <div ref={regulatoryContextRef} className="bg-[#1a2540] border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(regulatoryContext.header, regulatoryContextRef)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#0f1729] transition-colors cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {regulatoryContext.header}
              </h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ease-in-out ${expandedSections.has(regulatoryContext.header) ? 'rotate-180' : ''}`}
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
                  className="text-gray-300 leading-relaxed"
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

