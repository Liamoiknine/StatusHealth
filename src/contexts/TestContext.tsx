'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAvailableTests } from '@/lib/csv-parser-client';
import { TestMetadata } from '@/app/api/csv-parser';

interface TestContextType {
  selectedTest: number;
  availableTests: TestMetadata[];
  setSelectedTest: (id: number) => void;
  isLoading: boolean;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export function TestProvider({ children }: { children: ReactNode }) {
  const [selectedTest, setSelectedTest] = useState(1);
  const [availableTests, setAvailableTests] = useState<TestMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAvailableTests() {
      try {
        const tests = await getAvailableTests();
        setAvailableTests(tests);
      } catch (error) {
        console.error('Error loading available tests:', error);
        // Fallback to default test if API fails
        setAvailableTests([{ id: 1, filename: 'all-chemicals_test1.csv', date: '10/18/24' }]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAvailableTests();
  }, []);

  return (
    <TestContext.Provider value={{ selectedTest, availableTests, setSelectedTest, isLoading }}>
      {children}
    </TestContext.Provider>
  );
}

export function useTest() {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
}
