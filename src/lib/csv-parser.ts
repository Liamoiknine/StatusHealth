export interface ChemicalData {
  compound: string;
  exposureCategory: string;
  primarySource: string;
  secondarySources: string | null;
  value: number;
}

export async function parseChemicalsCSV(): Promise<ChemicalData[]> {
  try {
    const response = await fetch('/api/chemicals');
    if (!response.ok) {
      throw new Error('Failed to fetch chemicals');
    }
    return await response.json();
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}
