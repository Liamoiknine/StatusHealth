import { NextResponse } from 'next/server';
import { getAvailableTests } from '@/app/api/csv-parser';

export async function GET() {
  try {
    const tests = await getAvailableTests();
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Error in tests API route:', error);
    return NextResponse.json({ error: 'Failed to load available tests' }, { status: 500 });
  }
}
