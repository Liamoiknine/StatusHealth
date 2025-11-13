import { NextResponse } from 'next/server';
import { parseChemicalsCSV, ChemicalData, getAvailableTests } from '@/app/api/csv-parser';

export interface CategoryLongitudinalDataPoint {
  date: string;
  testId: number;
  averagePercentile?: number;
  detectionRate: number;
  totalDetected: number;
  totalChemicals: number;
}

export interface CategoryLongitudinalResponse {
  category: string;
  data: CategoryLongitudinalDataPoint[];
  hasData: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    if (!category) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
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

    // Aggregate data for the category across all tests
    const categoryData: CategoryLongitudinalDataPoint[] = [];
    
    for (let testId = 1; testId <= allTestsData.length; testId++) {
      const testData = allTestsData[testId - 1];
      if (!testData) continue;
      
      // Filter chemicals in this category
      const categoryChemicals = testData.filter(c => c.exposureCategory === category);
      
      if (categoryChemicals.length === 0) continue;
      
      const testMeta = testMetadata.find(t => t.id === testId);
      const testDate = testMeta?.date || '';
      
      // Calculate aggregates
      const detectedChemicals = categoryChemicals.filter(c => c.value > 0);
      const totalDetected = detectedChemicals.length;
      const totalChemicals = categoryChemicals.length;
      const detectionRate = totalChemicals > 0 ? totalDetected / totalChemicals : 0;
      
      // Calculate average percentile (only for detected chemicals)
      let averagePercentile: number | undefined;
      if (detectedChemicals.length > 0) {
        const sumPercentile = detectedChemicals.reduce((sum, c) => sum + (c.percentile || 0), 0);
        averagePercentile = sumPercentile / detectedChemicals.length;
      }
      
      categoryData.push({
        date: testDate,
        testId: testId,
        averagePercentile,
        detectionRate,
        totalDetected,
        totalChemicals
      });
    }

    // Sort by date
    categoryData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    const hasData = categoryData.length > 0 && categoryData.some(point => point.totalDetected > 0);

    return NextResponse.json({
      category,
      data: categoryData,
      hasData
    });

  } catch (error) {
    console.error('Error in category longitudinal API route:', error);
    return NextResponse.json({ error: 'Failed to load category longitudinal data' }, { status: 500 });
  }
}

