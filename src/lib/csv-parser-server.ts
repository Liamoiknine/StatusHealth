import Papa from 'papaparse';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ChemicalData {
  name: string;
  content: number;
}

export async function parseChemicalsCSV(): Promise<ChemicalData[]> {
  try {
    const csvPath = join(process.cwd(), 'public', 'data', 'chemicals.csv');
    const csvText = readFileSync(csvPath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data.map((row: any) => ({
            name: row.name,
            content: parseFloat(row.content)
          }));
          // Sort by content value (highest first)
          data.sort((a, b) => b.content - a.content);
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
