'use client';

import { useState, useRef, useEffect } from 'react';
import { ChemicalData } from '@/app/api/csv-parser';

interface ChemicalSearchBarProps {
  chemicals: ChemicalData[];
  onSelect: (chemical: ChemicalData) => void;
}

export default function ChemicalSearchBar({ chemicals, onSelect }: ChemicalSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter chemicals based on search query (case-insensitive, matches on compound name)
  const filteredResults = searchQuery.trim()
    ? chemicals
        .filter(chemical =>
          chemical.compound.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10) // Limit to top 10 matches
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.trim().length > 0 && filteredResults.length > 0);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0 && filteredResults.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelect = (chemical: ChemicalData) => {
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect(chemical);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim().length > 0) {
        // If there's a query but no results, do nothing
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredResults.length) {
          handleSelect(filteredResults[highlightedIndex]);
        } else if (filteredResults.length > 0) {
          handleSelect(filteredResults[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search chemicals..."
          className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#9CBB04] focus:border-[#9CBB04] transition-all shadow-sm hover:border-[#9CBB04]/50"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#9CBB04]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && filteredResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#9CBB04]/30 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredResults.map((chemical, index) => (
            <button
              key={`${chemical.compound}-${index}`}
              type="button"
              onClick={() => handleSelect(chemical)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                highlightedIndex === index
                  ? 'bg-[#9CBB04] text-white'
                  : 'text-gray-900 hover:bg-[#9CBB04]/10 hover:text-[#8AA803]'
              }`}
            >
              <div className="font-medium">{chemical.compound}</div>
              <div className={`text-xs mt-0.5 ${
                highlightedIndex === index ? 'text-gray-300' : 'text-gray-500'
              }`}>
                {chemical.exposureCategory}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery.trim().length > 0 && filteredResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#9CBB04]/30 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
          No chemicals found matching &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
}

