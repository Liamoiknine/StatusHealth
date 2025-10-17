'use client';

import { useTest } from '@/contexts/TestContext';

export default function ProfilePanel() {
  const { selectedTest, availableTests, setSelectedTest, isLoading } = useTest();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [month, day, year] = dateStr.split('/');
      const date = new Date(parseInt(year) + 2000, parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mb-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Hi Danny,</h1>
        <p className="text-lg font-semibold text-gray-700 -mt-1">Your results are ready!</p>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2 text-base font-medium text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <select 
              value={selectedTest} 
              onChange={(e) => setSelectedTest(parseInt(e.target.value))}
              className="bg-transparent border-none text-gray-600 font-medium focus:outline-none focus:ring-0"
              disabled={isLoading}
            >
              {availableTests.map(test => (
                <option key={test.id} value={test.id}>
                  {formatDate(test.date)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2 text-base font-medium text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>313 biomarkers analyzed</span>
          </div>
        </div>
        
        <div className="mt-5 flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-base font-medium text-gray-600 hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Share</span>
          </button>
          
          <button className="flex items-center space-x-2 text-base font-medium text-gray-600 hover:text-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
