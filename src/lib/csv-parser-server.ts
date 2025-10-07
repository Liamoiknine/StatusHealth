import Papa from 'papaparse';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ChemicalData {
  compound: string;
  exposureCategory: string;
  primarySource: string;
  secondarySources: string | null;
  value: number;
}

export async function parseChemicalsCSV(): Promise<ChemicalData[]> {
  try {
    const csvPath = join(process.cwd(), 'public', 'data', 'all-chemicals copy.csv');
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
                ? parseFloat(typedRow.Value) 
                : 0
            };
          });
          // Sort by value (highest first)
          data.sort((a, b) => b.value - a.value);
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
