'use client';

import { HouseholdChemicalDataStructured, groupSectionsByHeader, GroupedSection } from '@/data/structured/household-products';
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ChemicalDetailSidebarProps {
  data: HouseholdChemicalDataStructured;
}

/**
 * Parse markdown-style formatting in text and convert to React elements
 * Supports: **bold**, *italic*, and regular text
 */
function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let lastIndex = 0;
  
  // Pattern to match **bold** (must be two asterisks) or *italic* (single asterisk)
  const boldPattern = /\*\*([^*]+)\*\*/g;
  const italicPattern = /\*([^*]+)\*/g;
  
  // First, find all bold matches
  const boldMatches: Array<{ index: number; endIndex: number; text: string }> = [];
  let match: RegExpExecArray | null;
  
  while ((match = boldPattern.exec(text)) !== null) {
    boldMatches.push({
      index: match.index,
      endIndex: match.index + match[0].length,
      text: match[1]
    });
  }
  
  // Then find italic matches that don't overlap with bold
  const italicMatches: Array<{ index: number; endIndex: number; text: string }> = [];
  italicPattern.lastIndex = 0;
  
  while ((match = italicPattern.exec(text)) !== null) {
    const overlaps = boldMatches.some(bold => 
      (match!.index >= bold.index && match!.index < bold.endIndex) ||
      (match!.index + match![0].length > bold.index && match!.index + match![0].length <= bold.endIndex) ||
      (match!.index < bold.index && match!.index + match![0].length > bold.endIndex)
    );
    
    const prevChar = match.index > 0 ? text[match.index - 1] : '';
    const nextChar = match.index + match[0].length < text.length ? text[match.index + match[0].length] : '';
    const isPartOfBold = prevChar === '*' || nextChar === '*';
    
    if (!overlaps && !isPartOfBold) {
      italicMatches.push({
        index: match.index,
        endIndex: match.index + match[0].length,
        text: match[1]
      });
    }
  }
  
  // Combine and sort all matches by index
  const allMatches = [
    ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
    ...italicMatches.map(m => ({ ...m, type: 'italic' as const }))
  ].sort((a, b) => a.index - b.index);
  
  // Build the parts array
  for (const match of allMatches) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    if (match.type === 'bold') {
      parts.push(<strong key={`bold-${currentIndex}`} className="font-semibold">{match.text}</strong>);
    } else {
      parts.push(<em key={`italic-${currentIndex}`} className="italic">{match.text}</em>);
    }
    
    lastIndex = match.endIndex;
    currentIndex++;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  if (parts.length === 0) {
    return [text];
  }
  
  return parts;
}

/**
 * Generate a URL-friendly ID from a section header
 */
function generateSectionId(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ChemicalDetailSidebar({ data }: ChemicalDetailSidebarProps) {
  const groupedSections = groupSectionsByHeader(data.summary_sections);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' } | null>(null);
  const tooltipButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Define section order for consistent display
  const sectionOrder = [
    'Overview and Common Uses',
    'Exposure Pathways',
    'Health and Toxicological Information',
    'Regulatory and Monitoring Context',
  ];

  // Sort sections: known headers first in order, then others alphabetically
  const sortedSections = groupedSections.sort((a, b) => {
    const indexA = sectionOrder.indexOf(a.header);
    const indexB = sectionOrder.indexOf(b.header);
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.header.localeCompare(b.header);
  });


  // Tooltip explanations for each section type
  const tooltipExplanations: Record<string, string> = {
    'Overview and Common Uses': 'This section provides general information about the chemical, including what it is, where it comes from, and how it is commonly used in products and industries.',
    'Exposure Pathways': 'This section describes the various ways you may come into contact with this chemical, such as through food, water, air, consumer products, or occupational exposure.',
    'Health and Toxicological Information': 'This section contains information about potential health effects, toxicity levels, and what scientific research tells us about the risks associated with exposure to this chemical.',
    'Regulatory and Monitoring Context': 'This section explains how this chemical is regulated by government agencies, what safety standards exist, and how it is monitored in the environment and human populations.',
  };

  // Get tooltip explanation for a section header
  const getTooltipExplanation = (header: string): string => {
    return tooltipExplanations[header] || `This section provides detailed information about ${header.toLowerCase()}.`;
  };

  // Calculate tooltip position when opened
  useEffect(() => {
    const updatePosition = () => {
      if (openTooltip && tooltipButtonRefs.current.has(openTooltip)) {
        const button = tooltipButtonRefs.current.get(openTooltip);
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

  // Format URL for display
  const formatUrlForDisplay = (url: string, maxLength: number = 20): string => {
    try {
      let display = url.replace(/^https?:\/\//i, '');
      display = display.replace(/^www\./i, '');
      display = display.replace(/\/$/, '');
      if (display.length > maxLength) {
        display = display.substring(0, maxLength - 3) + '...';
      }
      return display;
    } catch {
      return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
    }
  };

  if (sortedSections.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-white via-gray-50 to-white border border-gray-200 rounded-xl shadow-sm py-4 lg:py-6 px-4 lg:px-12 relative">
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#9CBB04] rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#404B69] rounded-full blur-3xl"></div>
          </div>
        </div>
        <div className="relative z-10">
        {/* CAS Registry Number */}
        {data.cas_rn && (
          <div className="mb-2">
            <div className="bg-gray-50 rounded-lg p-3 lg:p-4 border border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-xs lg:text-sm font-medium text-gray-600">CAS Registry Number</span>
                <span className="text-xs lg:text-sm font-semibold text-gray-900">{data.cas_rn}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sections */}
        {sortedSections.map((section, index) => {
          const sectionId = generateSectionId(section.header);
          
          return (
            <div key={sectionId}>
              <div
                id={sectionId}
                ref={(el) => {
                  if (el) {
                    sectionRefs.current.set(sectionId, el);
                  }
                }}
                className="scroll-mt-24 py-4 lg:py-6"
              >
                <h3 className="text-lg lg:text-xl font-semibold text-[#404B69] mb-3 lg:mb-4 flex items-center gap-2">
                  {section.header}
                  <button
                    ref={(el) => {
                      if (el) {
                        tooltipButtonRefs.current.set(sectionId, el);
                      }
                    }}
                    onClick={() => setOpenTooltip(openTooltip === sectionId ? null : sectionId)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={`Information about ${section.header}`}
                    data-tooltip-trigger
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </button>
                  {openTooltip === sectionId && tooltipPosition && typeof window !== 'undefined' && createPortal(
                    <div 
                      className="fixed z-[9999] w-64 bg-black text-white text-xs rounded-lg p-3 shadow-xl" 
                      data-tooltip-content
                      style={{ 
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        transform: tooltipPosition.placement === 'above' ? 'translateY(-100%)' : 'none'
                      }}
                    >
                      <p>{getTooltipExplanation(section.header)}</p>
                      <div className={`absolute ${tooltipPosition.placement === 'above' ? '-bottom-1' : '-top-1'} right-4 w-2 h-2 bg-black transform rotate-45`}></div>
                    </div>,
                    document.body
                  )}
                </h3>
                <div className="prose max-w-none">
                  <p className="text-sm lg:text-base text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                    {parseMarkdown(section.content)}
                  </p>
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="list-none space-y-2 mb-4">
                      {section.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start text-gray-700">
                          <svg 
                            className="w-4 h-4 text-[#404B69] mr-2 mt-1 flex-shrink-0" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M9 12l2 2 4-4" 
                            />
                          </svg>
                          <span className="text-sm lg:text-base leading-relaxed">{parseMarkdown(bullet)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.sources && section.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {section.sources.map((source, sourceIndex) => (
                        <a 
                          key={sourceIndex}
                          href={source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white border border-[#9CBB04] text-xs text-[#9CBB04] hover:text-[#8AA803] hover:border-[#9CBB04] transition-colors"
                          title={source}
                        >
                          {formatUrlForDisplay(source)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {index < sortedSections.length - 1 && (
                <div className="border-t border-gray-300"></div>
              )}
            </div>
          );
        })}

        {/* General Sources */}
        {data.sources && data.sources.length > 0 && (
          <>
            <div className="border-t border-gray-300"></div>
            <div className="pt-4 lg:pt-6">
              <h4 className="text-xs lg:text-sm font-semibold text-gray-900 mb-3">General Sources</h4>
              <div className="flex flex-wrap gap-2">
                {data.sources.map((source, index) => (
                  <a 
                    key={index}
                    href={source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg bg-white border border-gray-300 text-xs text-[#9CBB04] hover:text-[#8AA803] hover:border-[#9CBB04] transition-colors"
                    title={source}
                  >
                    {formatUrlForDisplay(source)}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

