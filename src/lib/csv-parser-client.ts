// Client-side wrapper for CSV parsing
import { ChemicalData, TestMetadata } from '@/app/api/csv-parser';

// Client-side function to parse chemicals CSV
export async function parseChemicalsCSV(testId: number = 1): Promise<ChemicalData[]> {
  try {
    const response = await fetch(`/api/chemicals?testId=${testId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch chemicals');
    }
    return await response.json();
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}

// Client-side function to get available tests
export async function getAvailableTests(): Promise<TestMetadata[]> {
  try {
    const response = await fetch('/api/tests');
    if (!response.ok) {
      throw new Error('Failed to fetch available tests');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting available tests:', error);
    throw error;
  }
}
