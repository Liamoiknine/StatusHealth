'use client';

import Link from 'next/link';
import { getAllCategoryNames } from '@/data/category-overviews';

function getCategoryIcon(categoryName: string) {
  const iconMap: Record<string, React.ReactElement> = {
    'Agricultural Chemicals': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
      </svg>
    ),
    'Containers & Coatings': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/>
        <path d="M21 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/>
        <path d="M3 7h18"/>
        <path d="M7 7v10"/>
        <path d="M17 7v10"/>
      </svg>
    ),
    'Household Products': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    'Industrial Chemicals': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    'Persistent Pollutants': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
      </svg>
    ),
  };
  return iconMap[categoryName] || null;
}

export default function NavigationHub() {
  const allCategories = getAllCategoryNames();

  const navigationItems = [
    {
      title: 'View All Exposures',
      description: 'Browse all 313 chemicals',
      href: '/exposures',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'teal'
    },
    {
      title: 'Explore Categories',
      description: 'View by category',
      href: '/categories',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      color: 'blue'
    }
  ];

  return (
    <div className="bg-[#404B69] rounded-lg p-6 space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Quick Navigation</h2>
        <p className="text-gray-300 text-sm">Explore your results in detail</p>
      </div>

      {/* Main Navigation Links */}
      <div className="space-y-3">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group border border-[#9CBB04]/30 rounded-lg p-4 hover:border-[#9CBB04] hover:bg-[#9CBB04]/10 transition-all duration-300 bg-white/5 block"
          >
            <div className="flex items-start gap-3">
              <div className="text-[#9CBB04] group-hover:text-[#9CBB04] transition-colors flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white group-hover:text-[#9CBB04] transition-colors mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-300">{item.description}</p>
              </div>
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-[#9CBB04] transition-colors flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Category Quick Links */}
      <div className="pt-4 border-t border-[#9CBB04]/20 flex-1">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">Browse by Category</h3>
        <div className="grid grid-cols-3 gap-3">
          {allCategories.map((category) => (
            <Link
              key={category}
              href={`/categories?category=${encodeURIComponent(category)}`}
              className="group flex items-center justify-center p-3 border border-[#9CBB04]/30 rounded-lg hover:border-[#9CBB04] hover:bg-[#9CBB04]/10 transition-all duration-300 bg-white/5"
              title={category}
            >
              <div className="text-[#9CBB04] group-hover:text-[#9CBB04] transition-colors">
                {getCategoryIcon(category)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

