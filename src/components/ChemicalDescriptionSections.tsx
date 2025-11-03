'use client';

import { HouseholdChemicalDataStructured, groupSectionsByHeader } from '@/data/household-data-structured';

interface ChemicalDescriptionSectionsProps {
  data: HouseholdChemicalDataStructured;
}

export default function ChemicalDescriptionSections({ data }: ChemicalDescriptionSectionsProps) {
  const groupedSections = groupSectionsByHeader(data.summary_sections);

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
              {section.content}
            </p>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="list-none space-y-2 mt-4">
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
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

