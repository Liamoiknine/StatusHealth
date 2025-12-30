'use client';

import { useState, useEffect } from 'react';
import { useTest } from '@/contexts/TestContext';
import { TestMetadata } from '@/app/api/csv-parser';
import { formatTestDate } from '@/lib/date-utils';
import { getAvailableTests } from '@/lib/csv-parser-client';
import { useRouter } from 'next/navigation';

export default function TestsPage() {
  const { selectedTest, setSelectedTest } = useTest();
  const [availableTests, setAvailableTests] = useState<TestMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadTests() {
      setLoading(true);
      try {
        const tests = await getAvailableTests();
        // Sort by date descending (newest first)
        const sortedTests = [...tests].sort((a, b) => {
          if (!a.date || !b.date) return 0;
          const [aMonth, aDay, aYear] = a.date.split('/');
          const [bMonth, bDay, bYear] = b.date.split('/');
          const aDate = new Date(parseInt(aYear) + 2000, parseInt(aMonth) - 1, parseInt(aDay));
          const bDate = new Date(parseInt(bYear) + 2000, parseInt(bMonth) - 1, parseInt(bDay));
          return bDate.getTime() - aDate.getTime();
        });
        setAvailableTests(sortedTests);
      } catch (error) {
        console.error('Error loading tests:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadTests();
  }, []);

  const handleTestClick = (testId: number) => {
    setSelectedTest(testId);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9CBB04] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Tests</h1>
          <p className="text-gray-600">View and select from all your test results</p>
        </div>

        {/* Tests List */}
        <div className="space-y-0">
          {availableTests.map((test, index) => {
            const isSelected = test.id === selectedTest;
            const testDate = test.date ? formatTestDate(test.date) : `Test ${test.id}`;
            
            return (
              <div key={test.id}>
                <button
                  onClick={() => handleTestClick(test.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-all ${
                    isSelected ? 'bg-[#9CBB04]/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                          {testDate}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Test #{test.id}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="bg-[#9CBB04] text-white rounded-full px-3 py-1 text-xs font-semibold">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-[#9CBB04] font-medium ml-4">
                      <span>View Results</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
                {index < availableTests.length - 1 && (
                  <div className="border-b border-gray-200"></div>
                )}
              </div>
            );
          })}
        </div>

        {availableTests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No tests available.</p>
          </div>
        )}

        {/* Schedule Next Test Panel */}
        <div className="mt-8 bg-[#404B69] rounded-lg p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Schedule Your Next Test
              </h2>
              <p className="text-gray-300 mb-4">
                Regular testing helps you track changes in your chemical exposure over time and make informed decisions about your health.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#9CBB04] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Recommended testing interval: Every 3-6 months</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#9CBB04] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Track your progress and identify trends</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#9CBB04] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Get personalized recommendations based on your results</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:ml-6">
              <button className="bg-[#9CBB04] text-white rounded-lg px-6 py-3 hover:bg-[#8AA803] transition-colors font-medium text-sm whitespace-nowrap">
                Schedule Test
              </button>
              <button className="bg-white text-[#404B69] border border-white rounded-lg px-6 py-3 hover:bg-gray-100 transition-colors font-medium text-sm whitespace-nowrap">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
