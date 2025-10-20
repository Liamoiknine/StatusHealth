import { NextResponse } from 'next/server';
import { parseChemicalsCSV, ChemicalData, getAvailableTests } from '@/app/api/csv-parser';

export interface LongitudinalDataPoint {
  date: string;
  value: number;
  percentile?: number;
  testId: number;
  detected: boolean;
  rangeLow?: number;
  rangeHigh?: number;
}

export interface LongitudinalResponse {
  chemicalName: string;
  data: LongitudinalDataPoint[];
  hasData: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chemicalName = searchParams.get('chemical');
    
    if (!chemicalName) {
      return NextResponse.json({ error: 'Chemical name is required' }, { status: 400 });
    }

    // Get all available tests with their metadata
    const testMetadata = await getAvailableTests();
    const allTestsData: ChemicalData[][] = [];
    
    for (let testId = 1; testId <= 4; testId++) {
      try {
        const chemicals = await parseChemicalsCSV(testId);
        allTestsData.push(chemicals);
      } catch (error) {
        console.error(`Error loading test ${testId}:`, error);
        // Continue with other tests even if one fails
      }
    }

    // Find the chemical across all tests
    const longitudinalData: LongitudinalDataPoint[] = [];
    
    for (let testId = 1; testId <= allTestsData.length; testId++) {
      const testData = allTestsData[testId - 1];
      if (!testData) continue;
      
      const chemical = testData.find(c => c.compound === chemicalName);
      const testMeta = testMetadata.find(t => t.id === testId);
      const testDate = testMeta?.date || '';
      
      if (chemical) {
        longitudinalData.push({
          date: (chemical.date && chemical.date.trim() !== '') ? chemical.date : testDate,
          value: chemical.value,
          percentile: chemical.percentile,
          testId: testId,
          detected: chemical.value > 0,
          rangeLow: chemical.rangeLow,
          rangeHigh: chemical.rangeHigh
        });
      } else {
        // Chemical not found in this test - add a point with 0 value
        longitudinalData.push({
          date: testDate,
          value: 0,
          percentile: undefined,
          testId: testId,
          detected: false,
          rangeLow: undefined,
          rangeHigh: undefined
        });
      }
    }

    // Sort by date
    longitudinalData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    const hasData = longitudinalData.some(point => point.detected);

    return NextResponse.json({
      chemicalName,
      data: longitudinalData,
      hasData
    });

  } catch (error) {
    console.error('Error in longitudinal API route:', error);
    return NextResponse.json({ error: 'Failed to load longitudinal data' }, { status: 500 });
  }
}
