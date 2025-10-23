import Papa from 'papaparse';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface ChemicalData {
  compound: string;
  exposureCategory: string;
  primarySource: string;
  secondarySources: string | null;
  value: number;
  rangeLow?: number;
  rangeHigh?: number;
  percentile?: number;
  date: string;
  population?: number;
}

export interface TestMetadata {
  id: number;
  filename: string;
  date: string;
}

export async function parseChemicalsCSV(testId: number = 1): Promise<ChemicalData[]> {
  try {
    const csvPath = join(process.cwd(), 'public', 'data', 'p1', `all-chemicals_test${testId}.csv`);
    const csvText = readFileSync(csvPath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data.map((row: unknown) => {
            const typedRow = row as Record<string, string>;
            return {
              compound: typedRow.Compound,
              exposureCategory: typedRow['Exposure Category'],
              primarySource: typedRow['Primary Source'],
              secondarySources: typedRow['Secondary Source(s)'] && typedRow['Secondary Source(s)'].trim() !== '' 
                ? typedRow['Secondary Source(s)'] 
                : null,
              value: typedRow.Value && typedRow.Value.trim() !== '' 
                ? parseFloat(typedRow.Value) || 0
                : 0,
              rangeLow: typedRow.range_low && typedRow.range_low.trim() !== '' 
                ? parseFloat(typedRow.range_low) || undefined
                : undefined,
              rangeHigh: typedRow.range_high && typedRow.range_high.trim() !== '' 
                ? parseFloat(typedRow.range_high) || undefined
                : undefined,
              percentile: typedRow.percentile && typedRow.percentile.trim() !== '' 
                ? parseFloat(typedRow.percentile) || undefined
                : undefined,
              date: typedRow.date || '',
              population: typedRow.population && typedRow.population.trim() !== '' 
                ? parseFloat(typedRow.population) || undefined
                : undefined
            };
          });
          resolve(data);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}

export async function getAvailableTests(): Promise<TestMetadata[]> {
  try {
    const dataDir = join(process.cwd(), 'public', 'data', 'p1');
    const files = readdirSync(dataDir);
    
    const testFiles = files
      .filter(file => file.startsWith('all-chemicals_test') && file.endsWith('.csv'))
      .map(file => {
        const testId = parseInt(file.match(/test(\d+)/)?.[1] || '1');
        return { id: testId, filename: file };
      })
      .sort((a, b) => a.id - b.id);

    // Read dates from each file
    const testsWithDates: TestMetadata[] = [];
    for (const test of testFiles) {
      try {
        const csvPath = join(dataDir, test.filename);
        const csvText = readFileSync(csvPath, 'utf-8');
        const lines = csvText.split('\n');
        if (lines.length > 1) {
          const firstDataRow = lines[1].split(',');
          // Date is at index 8 (9th column), not the last column
          const date = firstDataRow[8]?.trim() || '';
          testsWithDates.push({
            id: test.id,
            filename: test.filename,
            date: date
          });
        } else {
          testsWithDates.push({
            id: test.id,
            filename: test.filename,
            date: ''
          });
        }
      } catch (error) {
        console.error(`Error reading date from ${test.filename}:`, error);
        testsWithDates.push({
          id: test.id,
          filename: test.filename,
          date: ''
        });
      }
    }

    return testsWithDates;
  } catch (error) {
    console.error('Error getting available tests:', error);
    throw error;
  }
}
