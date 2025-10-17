import { NextResponse } from 'next/server';
import { parseChemicalsCSV } from '@/app/api/csv-parser';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = parseInt(searchParams.get('testId') || '1');
    
    const chemicals = await parseChemicalsCSV(testId);
    return NextResponse.json(chemicals);
  } catch (error) {
    console.error('Error in chemicals API route:', error);
    return NextResponse.json({ error: 'Failed to load chemicals' }, { status: 500 });
  }
}
