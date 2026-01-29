'use client';

import React from 'react';

/**
 * Get category icon component
 * @param categoryName - The name of the category
 * @param size - Optional size class (default: 'w-6 h-6')
 * @returns React element with the category icon
 */
export function getCategoryIcon(categoryName: string, size: string = 'w-6 h-6'): React.ReactElement {
  const iconMap: Record<string, React.ReactElement> = {
    'Agricultural Chemicals': (
      <svg className={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
      </svg>
    ),
    'Containers & Coatings': (
      <svg className={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/>
        <path d="M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/>
        <path d="M3 7h18"/>
        <path d="M7 7v10"/>
        <path d="M17 7v10"/>
      </svg>
    ),
    'Household Products': (
      <svg className={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    'Industrial Chemicals': (
      <svg className={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    'Persistent Pollutants': (
      <svg className={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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
      <svg className={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
      </svg>
    ),
  };

  return iconMap[categoryName] || (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

