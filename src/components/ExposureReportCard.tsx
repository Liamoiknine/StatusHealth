import Link from 'next/link';
import { ChemicalData } from '@/app/api/csv-parser';
import { getCategoryStatusInfo } from '@/app/api/utils';

interface ExposureReportCardProps {
  categories: Array<{
    category: string;
    detectedCount: number;
    totalCount: number;
    chemicals: ChemicalData[];
  }>;
}

export default function ExposureReportCard({ categories }: ExposureReportCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-gray-900">Your Exposures</h2>
        </div>
        <Link href="/categories" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
        By examining the chemicals in your blood, this report provides key findings and personalized health recommendations while allowing you to check your health categories trends over your previous reports.
      </p>
      
      <div className="space-y-3 flex-1 mb-8">
        {categories
          .map(({ category, detectedCount, totalCount, chemicals }) => {
            const statusInfo = getCategoryStatusInfo(chemicals);
            return { category, detectedCount, totalCount, chemicals, statusInfo };
          })
          .sort((a, b) => {
            // Sort by classification priority: Pay Attention > Monitor Only > Low Exposure
            const priorityOrder = { 'Pay Attention': 0, 'Monitor Only': 1, 'Low Exposure': 2 };
            const aPriority = priorityOrder[a.statusInfo.text as keyof typeof priorityOrder] ?? 3;
            const bPriority = priorityOrder[b.statusInfo.text as keyof typeof priorityOrder] ?? 3;
            
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            
            // If same priority, sort by detected count (highest first)
            return b.detectedCount - a.detectedCount;
          })
          .map(({ category, detectedCount, statusInfo }) => {
            return (
              <Link key={category} href={`/category/${encodeURIComponent(category)}`} className="block">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
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
                  <div className={`w-4 h-4 rounded-full ${statusInfo.color}`}></div>
                </div>
              </Link>
            );
          })}
      </div>
      
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Pay Attention</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-600">Monitor Only</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-gray-600">Low Exposure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
