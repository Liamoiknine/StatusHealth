'use client';

import Link from 'next/link';
import { getCategoryStatusInfo } from '@/app/api/utils';
import { ChemicalData } from '@/app/api/csv-parser';

interface CategoriesSidebarProps {
  categories: Array<{
    category: string;
    detectedCount: number;
    totalCount: number;
    chemicals: ChemicalData[];
  }>;
  currentCategory?: string;
}

export default function CategoriesSidebar({ categories, currentCategory }: CategoriesSidebarProps) {
  const isViewingAll = currentCategory === 'all-exposures';
  
  return (
    <div className="w-80 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h2>
        <div className="space-y-2">
          {categories.map(({ category, detectedCount, totalCount, chemicals }) => {
            // Use the same classification system as category cards
            const statusInfo = getCategoryStatusInfo(chemicals);
            
            const isActive = currentCategory === category;
            
            return (
              <Link
                key={category}
                href={`/categories?category=${encodeURIComponent(category)}`}
                className="block"
              >
                <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 border border-blue-200' 
                    : 'hover:bg-gray-100'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {category}
                    </div>
                    <div className="text-xs text-gray-500">
                      {detectedCount}/{totalCount} detected
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* View All Exposures Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link href="/exposures" className="block">
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              isViewingAll 
                ? 'bg-blue-100 border border-blue-200' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <div className="flex-1">
                <div className={`text-sm font-medium ${isViewingAll ? 'text-blue-900' : 'text-gray-900'}`}>
                  View All Exposures
                </div>
                <div className="text-xs text-gray-500">
                  Across all categories
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
