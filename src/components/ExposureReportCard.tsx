import Link from 'next/link';
import { ChemicalData } from '@/lib/csv-parser';

interface ExposureReportCardProps {
  categories: Array<{
    category: string;
    detectedCount: number;
    totalCount: number;
  }>;
}

export default function ExposureReportCard({ categories }: ExposureReportCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-[400px] flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-gray-900">Your Exposures</h2>
        </div>
        <Link href="/categories" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      <p className="text-gray-600 mb-3 text-[12px] leading-relaxed text-justify">
        By examining the chemicals in your blood, this report provides key findings and personalized health recommendations while allowing you to check your health categories trends over your previous reports.
      </p>
      
      <div className="flex justify-end mb-2">
        <span className="text-sm font-bold text-gray-500">Oct 24</span>
      </div>
      
      <div className="space-y-2 flex-1 mb-6">
        {categories
          .map(({ category, detectedCount, totalCount }) => {
            return {
              category,
              detectedCount,
              totalCount
            };
          })
          .sort((a, b) => b.detectedCount - a.detectedCount) // Sort by detected count (highest to lowest)
          .map(({ category, detectedCount, totalCount }, index) => {
            // Make exactly 2 categories "Monitor Only" (orange) - the ones with highest detected counts
            let statusColor = 'bg-green-600'; // Optimal (dark green)
            let statusText = 'Optimal';
            
            if (detectedCount === 0) {
              statusColor = 'bg-green-400'; // Health Booster (light green)
              statusText = 'Health Booster';
            } else if (index < 2) {
              statusColor = 'bg-yellow-400'; // Monitor Only (yellow-orange)
              statusText = 'Monitor Only';
            }
          
          return (
            <div key={category} className="flex items-stretch">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{category}</div>
                  <div className="text-xs text-gray-500">
                    {detectedCount} exposures
                  </div>
                </div>
              </div>
              <div className={`w-12 rounded-sm ${statusColor}`}></div>
            </div>
          );
        })}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Pay attention</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-gray-600">Monitor Only</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span className="text-gray-600">Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
