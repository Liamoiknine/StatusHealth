'use client';

import Link from 'next/link';
import { getAllCategoryNames } from '@/data/category-overviews';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Quick Navigation</h2>
        <p className="text-gray-600 text-sm">Explore your results in detail</p>
      </div>

      {/* Main Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group border border-gray-200 rounded-lg p-4 hover:border-teal-500 hover:shadow-md transition-all duration-300 bg-white"
          >
            <div className="flex items-start gap-3">
              <div className={`text-${item.color}-600 group-hover:text-${item.color}-700 transition-colors flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0" 
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
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Browse by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {allCategories.map((category) => (
            <Link
              key={category}
              href={`/categories?category=${encodeURIComponent(category)}`}
              className="text-sm text-gray-600 hover:text-teal-600 hover:underline py-1 transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

