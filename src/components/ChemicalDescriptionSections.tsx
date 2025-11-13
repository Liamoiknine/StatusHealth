'use client';

import { HouseholdChemicalDataStructured, groupSectionsByHeader } from '@/data/structured/household-products';
import React from 'react';

interface ChemicalDescriptionSectionsProps {
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
  // We need to be careful: **bold** should take precedence over *italic*
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
    // Check if this italic match overlaps with any bold match
    const overlaps = boldMatches.some(bold => 
      (match!.index >= bold.index && match!.index < bold.endIndex) ||
      (match!.index + match![0].length > bold.index && match!.index + match![0].length <= bold.endIndex) ||
      (match!.index < bold.index && match!.index + match![0].length > bold.endIndex)
    );
    
    // Also check if it's actually part of a bold pattern (adjacent asterisks)
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
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the formatted text
    if (match.type === 'bold') {
      parts.push(<strong key={`bold-${currentIndex}`} className="font-semibold text-white">{match.text}</strong>);
    } else {
      parts.push(<em key={`italic-${currentIndex}`} className="italic">{match.text}</em>);
    }
    
    lastIndex = match.endIndex;
    currentIndex++;
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  // If no markdown was found, return the original text
  if (parts.length === 0) {
    return [text];
  }
  
  return parts;
}

export default function ChemicalDescriptionSections({ data }: ChemicalDescriptionSectionsProps) {
  const groupedSections = groupSectionsByHeader(data.summary_sections);

  // Format URL for display: remove protocol, www, and truncate if needed
  const formatUrlForDisplay = (url: string, maxLength: number = 20): string => {
    try {
      // Remove protocol (http://, https://)
      let display = url.replace(/^https?:\/\//i, '');
      
      // Remove www.
      display = display.replace(/^www\./i, '');
      
      // Remove trailing slash
      display = display.replace(/\/$/, '');
      
      // Truncate if too long
      if (display.length > maxLength) {
        display = display.substring(0, maxLength - 3) + '...';
      }
      
      return display;
    } catch {
      // If URL parsing fails, just truncate the original
      return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url;
    }
  };

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
    
    // If both are in the order array, sort by their index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only A is in the order, it comes first
    if (indexA !== -1) return -1;
    // If only B is in the order, it comes first
    if (indexB !== -1) return 1;
    // Neither is in the order, sort alphabetically
    return a.header.localeCompare(b.header);
  });

  if (sortedSections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {sortedSections.map((section, index) => (
        <div 
          key={index}
          className="bg-[#0f1729] rounded-lg p-6 border border-gray-800"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <svg 
              className="w-5 h-5 mr-2 text-teal-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            {section.header}
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
              {parseMarkdown(section.content)}
            </p>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-none space-y-2 mb-4">
                {section.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start text-gray-300">
                    <svg 
                      className="w-4 h-4 text-teal-400 mr-2 mt-1 flex-shrink-0" 
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
                    <span className="leading-relaxed">{parseMarkdown(bullet)}</span>
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
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#1a2540] border border-gray-600 text-xs text-teal-400 hover:text-teal-300 hover:border-teal-500 transition-colors"
                    title={source}
                  >
                    {formatUrlForDisplay(source)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      {data.sources && data.sources.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-sm font-semibold text-white mb-3">General Sources</h4>
          <div className="flex flex-wrap gap-2">
            {data.sources.map((source, index) => (
              <a 
                key={index}
                href={source} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#0f1729] border border-gray-600 text-xs text-teal-400 hover:text-teal-300 hover:border-teal-500 transition-colors"
                title={source}
              >
                {formatUrlForDisplay(source)}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

