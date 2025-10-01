import { NextResponse } from 'next/server';
import { parseChemicalsCSV } from '@/lib/csv-parser-server';

export async function GET() {
  try {
    const chemicals = await parseChemicalsCSV();
    return NextResponse.json(chemicals);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Failed to load chemicals' }, { status: 500 });
  }
}
