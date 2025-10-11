'use client';

import { useState } from 'react';

export default function ProfilePanel() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('October 18, 2024');

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="space-y-2">
        {/* Greeting */}
        <h1 className="text-3xl font-bold text-gray-900">Hi Danny,</h1>
        
        {/* Results Message */}
        <p className="text-lg text-gray-700 -mt-1">Your results are ready!</p>
        
        {/* Bottom Row: Date, Biomarkers, and Action Buttons */}
        <div className="flex items-center justify-between -mb-1">
          <div className="flex items-center space-x-6">
            {/* Calendar Icon and Date Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{selectedDate}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="py-1">
                    <button
                      onClick={() => handleDateSelect('October 18, 2024')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      October 18, 2024
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Biomarkers Count */}
            <div className="bg-gray-100 rounded-full px-3 py-1 flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">313 biomarkers analyzed</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Share Button */}
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Share</span>
            </button>
            
            {/* Download Button */}
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
